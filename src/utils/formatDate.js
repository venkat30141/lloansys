const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function formatDate(input) {
  const d = new Date(input)
  if (isNaN(d)) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mmm = MONTHS[d.getMonth()]
  const yyyy = d.getFullYear()
  return `${dd}-${mmm}-${yyyy}`
}
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
