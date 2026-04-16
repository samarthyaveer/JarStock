import React from "react";

const SkeletonRow = () => (
  <tr>
    <td className="px-3 py-2 md:py-3">
      <div className="skeleton h-3 md:h-4 w-20 rounded-chip" />
      <div className="mt-2 h-3 w-28 md:w-32 rounded-chip skeleton" />
    </td>
    <td className="px-3 py-2 md:py-3 text-right">
      <div className="skeleton h-3 md:h-4 w-[88px] rounded-chip" />
    </td>
    <td className="px-3 py-2 md:py-3 text-right">
      <div className="skeleton h-3 md:h-4 w-[88px] rounded-chip" />
    </td>
    <td className="px-3 py-2 md:py-3">
      <div className="skeleton h-6 md:h-8 w-20 rounded-chip" />
    </td>
  </tr>
);

export default SkeletonRow;
