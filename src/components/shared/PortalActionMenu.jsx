import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders row action dropdowns outside table scroll containers so they are never
 * clipped by overflow-x/overflow-y wrappers, especially on the last table rows.
 */
export default function PortalActionMenu({
  open,
  anchorRef,
  onClose,
  children,
  width = 144,
  offset = 6,
  className = "",
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, visibility: "hidden" });

  const updatePosition = () => {
    const anchor = anchorRef?.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const menuH = menuRef.current?.offsetHeight || 120;
    const menuW = menuRef.current?.offsetWidth || width;

    let left = rect.right - menuW;
    left = Math.max(8, Math.min(left, viewportW - menuW - 8));

    let top = rect.bottom + offset;
    if (top + menuH > viewportH - 8) {
      top = Math.max(8, rect.top - menuH - offset);
    }

    setPosition({ top, left, visibility: "visible" });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // Recalculate after first paint when menu height is available.
    const id = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      const anchor = anchorRef?.current;
      const menu = menuRef.current;
      if (menu?.contains(event.target) || anchor?.contains(event.target)) return;
      onClose?.();
    };
    const handleReposition = () => updatePosition();
    const stopInsideMouseDown = (event) => event.stopPropagation();

    const menu = menuRef.current;
    // Stop outside-click handlers on mouse down, but do NOT stop native click
    // in capture phase. Stopping click capture prevents React portal button
    // onClick handlers from firing.
    menu?.addEventListener("mousedown", stopInsideMouseDown, true);
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      menu?.removeEventListener("mousedown", stopInsideMouseDown, true);
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className={`fixed z-[9999] bg-white rounded-xl border border-surface-border shadow-xl py-1 ${className}`}
      style={{ width, top: position.top, left: position.left, visibility: position.visibility }}
    >
      {children}
    </div>,
    document.body,
  );
}
