import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export const NestedPageRow = ({
  page,
  form,
  togglePermission,
  parentKey = null,
}) => {
  const [openId, setOpenId] = useState(null); // ✅ each row manages its own children's open state
  const hasSub = page.sub && page.sub.length > 0;
  const isParentChecked = parentKey ? !!form.permissions[parentKey] : true;
  const isChecked = !!form.permissions[page.key];
  const isOpen = openId === page.id;

  const handleToggle = () => {
    setOpenId(isOpen ? null : page.id);
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100">
        {/* Column 1: Select */}
        <td className="py-3 text-center w-16">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={parentKey && !isParentChecked}
            onChange={() => togglePermission(page.key, parentKey)}
            className={`w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer 
              ${parentKey && !isParentChecked ? "opacity-30 cursor-not-allowed" : ""}`}
          />
        </td>

        {/* Column 2: Webpage name */}
        <td
          className="py-3 text-center"
          style={{ paddingLeft: `${page.level * 20}px` }}
        >
          <span
            className={`text-sm ${
              page.level === 1
                ? "font-semibold text-slate-900"
                : "text-slate-600"
            }`}
          >
            {page.display}
          </span>
        </td>

        {/* Column 3: Details */}
        <td className="py-3 pr-5 text-center w-16">
          {hasSub && (
            <button
              onClick={handleToggle}
              className="p-1 hover:bg-slate-200 rounded inline-flex items-center justify-center"
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </td>
      </tr>

      {/* Sub-rows rendered when open */}
      {isOpen && hasSub && (
        <>
          {page.sub.map((subPage) => (
            <NestedPageRow
              key={subPage.id}
              page={subPage}
              form={form}
              togglePermission={togglePermission}
              parentKey={page.key}
              // ✅ No openId/setOpenId passed down — each level is self-contained
            />
          ))}
        </>
      )}
    </>
  );
};
