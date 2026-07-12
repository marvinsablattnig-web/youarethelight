"use client";

import { Menu, X } from "lucide-react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useCallback, useEffect, useRef } from "react";

const menuToggleAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 30,
  w: 64,
  h: 64,
  nm: "mobile-menu-toggle",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Top",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [45] }, { t: 30, s: [45] }] },
        p: { a: 1, k: [{ t: 0, s: [32, 20, 0], e: [32, 32, 0] }, { t: 30, s: [32, 32, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [28, 4] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 2 }, nm: "Rect Path 1" },
            { ty: "fl", c: { a: 0, k: [0.9569, 0.9451, 0.9176, 1] }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "Fill 1" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: "Transform" },
          ],
          nm: "Shape 1",
          np: 2,
          cix: 2,
          bm: 0,
        },
      ],
      ip: 0,
      op: 31,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Middle",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100], e: [0] }, { t: 30, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [32, 32, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [28, 4] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 2 }, nm: "Rect Path 1" },
            { ty: "fl", c: { a: 0, k: [0.9569, 0.9451, 0.9176, 1] }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "Fill 1" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: "Transform" },
          ],
          nm: "Shape 1",
          np: 2,
          cix: 2,
          bm: 0,
        },
      ],
      ip: 0,
      op: 31,
      st: 0,
      bm: 0,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Bottom",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [-45] }, { t: 30, s: [-45] }] },
        p: { a: 1, k: [{ t: 0, s: [32, 44, 0], e: [32, 32, 0] }, { t: 30, s: [32, 32, 0] }] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "rc", d: 1, s: { a: 0, k: [28, 4] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 2 }, nm: "Rect Path 1" },
            { ty: "fl", c: { a: 0, k: [0.9569, 0.9451, 0.9176, 1] }, o: { a: 0, k: 100 }, r: 1, bm: 0, nm: "Fill 1" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 }, nm: "Transform" },
          ],
          nm: "Shape 1",
          np: 2,
          cix: 2,
          bm: 0,
        },
      ],
      ip: 0,
      op: 31,
      st: 0,
      bm: 0,
    },
  ],
} as const;

type MobileMenuToggleProps = {
  open: boolean;
  className?: string;
};

export function MobileMenuToggle({ open, className }: MobileMenuToggleProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const targetFrame = open ? 30 : 0;

  const syncFrame = useCallback(() => {
    if (!lottieRef.current) {
      return;
    }

    lottieRef.current.goToAndStop(targetFrame, true);
  }, [targetFrame]);

  useEffect(() => {
    if (open) {
      lottieRef.current?.goToAndPlay(0, true);
      return;
    }

    syncFrame();
  }, [open, syncFrame]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Lottie
        lottieRef={lottieRef}
        animationData={menuToggleAnimation}
        autoplay={false}
        loop={false}
        onDOMLoaded={syncFrame}
        className="absolute inset-0 opacity-80"
      />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <Menu
          className={`h-full w-full transition duration-300 ease-out ${
            open ? "scale-75 rotate-45 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
        />
      </span>
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <X
          className={`h-full w-full transition duration-300 ease-out ${
            open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-45 opacity-0"
          }`}
        />
      </span>
    </div>
  );
}
