import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const NestedPageRow = ({
  page,
  form,
  togglePermission,
  parentKey = null,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSub = page.sub && page.sub.length > 0;
  const isDashboard = page.key === "dashboard";
  const isParentChecked = parentKey ? !!form.permissions[parentKey] : true;
  const isChecked = isDashboard ? true : !!form.permissions[page.key];
  const visualDepth = Number.isFinite(page.level) ? Math.max(page.level - 1, depth) : depth;

  useEffect(() => {
    if (!hasSub) return;
    // Checkbox behaves like the dropdown: checked parent opens its children,
    // unchecked parent closes them. The chevron can still manually open/close.
    setIsOpen(isChecked);
  }, [hasSub, isChecked]);

  const handleToggle = () => {
    if (hasSub) setIsOpen((prev) => !prev);
  };

  return (
    <>
      <tr className={`transition-colors border-b border-slate-100 ${visualDepth === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/70"}`}>
        <td className="py-3 text-center w-16 align-middle">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isDashboard || (parentKey && !isParentChecked)}
            onChange={() => togglePermission(page.key, parentKey)}
            className={`w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer 
              ${isDashboard || (parentKey && !isParentChecked) ? "opacity-60 cursor-not-allowed" : ""}`}
          />
        </td>

        <td className="py-3 align-middle">
          <div
            className="flex items-center gap-2 min-w-0"
            style={{ paddingLeft: `${visualDepth * 26}px` }}
          >
            {visualDepth > 0 && (
              <span className="h-6 w-4 border-l border-b border-slate-300 rounded-bl-lg flex-shrink-0 -mt-3" />
            )}
            <span
              className={`truncate text-sm ${
                hasSub
                  ? "font-semibold text-slate-900"
                  : "font-medium text-slate-600"
              }`}
            >
              {page.display}
            </span>
          </div>
        </td>

        <td className="py-3 pr-5 text-center w-20 align-middle">
          {hasSub ? (
            <button
              type="button"
              onClick={handleToggle}
              className="p-1.5 hover:bg-slate-200 rounded-lg inline-flex items-center justify-center text-slate-600"
              title={isOpen ? "Hide child pages" : "Show child pages"}
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </tr>

      {isOpen && hasSub &&
        page.sub.map((subPage) => (
          <NestedPageRow
            key={subPage.id}
            page={subPage}
            form={form}
            togglePermission={togglePermission}
            parentKey={page.key}
            depth={visualDepth + 1}
          />
        ))}
    </>
  );
};
