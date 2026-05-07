"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { MobileNav } from "./MobileNav";
import styles from "./PageShell.module.css";

type PageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  showMobileNav?: boolean;
  centerContent?: boolean;
};

export function PageShell({ title, description, children, showMobileNav = true, centerContent = false }: PageShellProps) {
  const [preview, setPreview] = useState({
    width: 360,
    height: 740
  });
  const topBlockRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const contentBlockRef = useRef<HTMLDivElement | null>(null);
  const [topBlockHeight, setTopBlockHeight] = useState(0);
  const [contentBlockHeight, setContentBlockHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const checkViewport = () => {
      const isBase = window.innerWidth <= 360 && window.innerHeight <= 740;
      const isLarge = window.innerWidth <= 390 && window.innerHeight <= 844;

      if (isBase) {
        setPreview({ width: 360, height: 740 });
        return;
      }

      if (isLarge) {
        setPreview({ width: 390, height: 844 });
        return;
      }

      setPreview({ width: 360, height: 740 });
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  useEffect(() => {
    const updateViewport = () => setViewportHeight(window.innerHeight);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!centerContent) return;
    const node = topBlockRef.current;
    if (!node) return;

    const updateTopHeight = () => setTopBlockHeight(node.getBoundingClientRect().height);
    updateTopHeight();

    const observer = new ResizeObserver(updateTopHeight);
    observer.observe(node);
    window.addEventListener("resize", updateTopHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTopHeight);
    };
  }, [centerContent, showMobileNav, title, description]);

  useEffect(() => {
    if (!centerContent) return;
    const node = contentBlockRef.current;
    if (!node) return;

    const updateContentHeight = () => setContentBlockHeight(node.getBoundingClientRect().height);
    updateContentHeight();

    const observer = new ResizeObserver(updateContentHeight);
    observer.observe(node);
    window.addEventListener("resize", updateContentHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateContentHeight);
    };
  }, [centerContent, children]);

  const formulaGap = centerContent ? Math.max(0, (viewportHeight - topBlockHeight - contentBlockHeight) / 2) : 0;

  useEffect(() => {
    if (!previewRef.current) return;
    previewRef.current.style.setProperty("--mobile-base-width", `${preview.width}px`);
    previewRef.current.style.setProperty("--mobile-base-height", `${preview.height}px`);
  }, [preview.width, preview.height]);

  useEffect(() => {
    if (!contentWrapperRef.current) return;
    const topValue = centerContent ? `${formulaGap}px` : "16px";
    contentWrapperRef.current.style.setProperty("--content-offset", topValue);
  }, [centerContent, formulaGap]);

  return (
    <main className="app-shell-outer mx-auto w-full px-0 py-0 md:px-4 md:py-3">
      <div className="app-shell-preview w-full max-w-md" ref={previewRef}>
        <section
          className={`mx-auto grid min-h-screen w-full max-w-md gap-4 px-4 py-5 ${
            centerContent ? "grid-rows-[auto_1fr]" : "grid-rows-[auto_auto]"
          }`}
        >
          <div className="w-full" ref={topBlockRef}>
            <section className={`app-card w-full ${styles.topCard}`}>
              <h1 className={styles.topTitle}>{title}</h1>
              {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            </section>
            {showMobileNav ? <MobileNav /> : null}
          </div>
          <div className="page-shell-content-offset w-full" ref={contentWrapperRef}>
            <div className="grid w-full grid-cols-1 gap-4" ref={contentBlockRef}>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
