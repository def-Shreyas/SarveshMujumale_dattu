// import React, { useRef } from "react";
// import { usePDF } from "react-to-pdf";

// export default function ReportPage() {
//   const { toPDF, targetRef } = usePDF({ filename: "Dattu_Report.pdf" });

//   return (
//     <div>
//       <button
//         onClick={() => toPDF()}
//         className="px-4 py-2 bg-blue-600 text-white rounded"
//       >
//         Download PDF
//       </button>

//       {/* The section that will be exported */}
//       <div ref={targetRef}>
//         {/** your dynamic HTML content goes here */}
//         <div dangerouslySetInnerHTML={{ __html: aiReport }} />
//       </div>
//     </div>
//   );
// }
