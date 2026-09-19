"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { UPLOAD_MAX_EDGE } from "@/lib/profile/limits";
import { MAX_ZOOM, type AvatarCrop } from "@/lib/profile/crop";
import { cn } from "@/lib/utils";

/**
 * Choosing which part of a picture becomes the avatar.
 *
 * Two jobs, and they share the same canvas so they belong together.
 *
 * **Framing.** Automatic cropping guesses at the interesting part, and on a
 * group photo or a picture with the subject off-centre it guesses wrong. Drag
 * to move, slide to zoom.
 *
 * **Downscaling.** This is also what fixes uploading on a real deployment. A
 * phone photo is four or five megabytes; a server action caps the request body
 * at one. Every real photograph therefore failed inside the framework, before
 * any validation ran, which is why the error said nothing useful. Resizing to
 * {@link UPLOAD_MAX_EDGE} first makes a real upload a couple of hundred
 * kilobytes - under every limit, and far quicker on mobile data.
 *
 * The server still validates and re-encodes what arrives. Nothing here is a
 * security boundary; it decides framing and saves bandwidth.
 */
export function AvatarEditor({
  file,
  size = 224,
  onChange,
  onCancel,
}: {
  file: File;
  size?: number;
  /** The downscaled image to upload, plus where the square sits in it. */
  onChange: (result: { blob: Blob; crop: AvatarCrop } | null) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("settings");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const [zoom, setZoom] = useState(1);
  const [centre, setCentre] = useState({ cx: 0.5, cy: 0.5 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const dragging = useRef<{ x: number; y: number } | null>(null);

  /**
   * Decode once, downscale once, keep both.
   *
   * `imageOrientation: "from-image"` is load-bearing: a portrait photo off a
   * phone is usually stored landscape with a flag saying to turn it. Without
   * this the editor would show it on its side and crop the wrong part.
   */
  useEffect(() => {
    let cancelled = false;
    let created: ImageBitmap | null = null;

    (async () => {
      try {
        const source = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        if (cancelled) {
          source.close();
          return;
        }

        const scale = Math.min(
          1,
          UPLOAD_MAX_EDGE / Math.max(source.width, source.height),
        );
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));

        const work = document.createElement("canvas");
        work.width = width;
        work.height = height;
        work.getContext("2d")!.drawImage(source, 0, 0, width, height);
        source.close();

        const blob = await new Promise<Blob | null>((resolve) =>
          work.toBlob(resolve, "image/webp", 0.9),
        );
        if (cancelled || !blob) return;

        created = await createImageBitmap(work);
        bitmapRef.current = created;
        blobRef.current = blob;
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      created?.close();
      bitmapRef.current = null;
    };
  }, [file]);

  /** The crop square in image pixels, clamped inside the picture. */
  const square = useCallback(() => {
    const bitmap = bitmapRef.current;
    if (!bitmap) return null;
    const side = Math.min(bitmap.width, bitmap.height) / zoom;
    const half = side / 2;
    const left = Math.min(
      Math.max(half, centre.cx * bitmap.width),
      bitmap.width - half,
    );
    const top = Math.min(
      Math.max(half, centre.cy * bitmap.height),
      bitmap.height - half,
    );
    return { side, x: left - half, y: top - half };
  }, [centre, zoom]);

  // Repaint whenever the framing changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    const box = square();
    if (!canvas || !bitmap || !box) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = size * ratio;
    canvas.height = size * ratio;

    const context = canvas.getContext("2d")!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      bitmap,
      box.x,
      box.y,
      box.side,
      box.side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [ready, size, square]);

  // Hand the parent the blob and the framing whenever either settles.
  useEffect(() => {
    const bitmap = bitmapRef.current;
    const blob = blobRef.current;
    const box = square();
    if (!ready || !bitmap || !blob || !box) return;

    onChange({
      blob,
      crop: {
        cx: (box.x + box.side / 2) / bitmap.width,
        cy: (box.y + box.side / 2) / bitmap.height,
        zoom,
      },
    });
    // `onChange` is a fresh closure every render in most callers; depending on
    // it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, centre, zoom]);

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const from = dragging.current;
    const bitmap = bitmapRef.current;
    const box = square();
    if (!from || !bitmap || !box) return;

    /*
     * A pixel dragged on screen should move the picture by a pixel, so the
     * movement is converted through the ratio between the displayed square and
     * the crop square - dragging feels wrong at any other rate, and wronger
     * the further you are zoomed in.
     */
    const perPixel = box.side / size;
    const dx = (event.clientX - from.x) * perPixel;
    const dy = (event.clientY - from.y) * perPixel;
    dragging.current = { x: event.clientX, y: event.clientY };

    setCentre((current) => ({
      cx: Math.min(1, Math.max(0, current.cx - dx / bitmap.width)),
      cy: Math.min(1, Math.max(0, current.cy - dy / bitmap.height)),
    }));
  }

  function endDrag(event: React.PointerEvent<HTMLCanvasElement>) {
    dragging.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (failed) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-wrong">{t("error.avatar.notAnImage")}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-accent hover:underline"
        >
          {t("removePicture")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/*
          The circle is a mask over a square canvas, because that is how the
          avatar is shown everywhere else - framing against a square and then
          discovering the corners are cut is a small betrayal.
        */}
        <div
          className="relative shrink-0 overflow-hidden rounded-full border-2 border-accent"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={cn(
              "h-full w-full touch-none select-none",
              ready ? "cursor-grab active:cursor-grabbing" : "opacity-0",
            )}
            style={{ width: size, height: size }}
          />
        </div>

        <div className="w-full space-y-3 sm:pt-2">
          <p className="text-xs text-muted">{t("dragToPosition")}</p>

          <label className="block space-y-1">
            <span className="text-xs text-muted">{t("zoom")}</span>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-accent"
              aria-label={t("zoom")}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setCentre({ cx: 0.5, cy: 0.5 });
            }}
            className="text-xs text-accent hover:underline"
          >
            {t("resetPosition")}
          </button>
        </div>
      </div>
    </div>
  );
}
