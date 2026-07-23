export const MANUAL_INBOUND_NOTE_MARK = "[MANUAL_INBOUND]";

export const withManualInboundNoteMark = (notes) => {
  const cleanNotes = String(notes || "").trim();
  return cleanNotes ? `${MANUAL_INBOUND_NOTE_MARK} ${cleanNotes}` : MANUAL_INBOUND_NOTE_MARK;
};

export const isManualInboundNote = (notes) =>
  String(notes || "").includes(MANUAL_INBOUND_NOTE_MARK);

