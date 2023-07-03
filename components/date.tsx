import { parseISO, format } from "date-fns"
export default function DateComp({ dateString }: { dateString: string }) {
  const date = parseISO(dateString ?? new Date().toISOString())
  return <time dateTime={dateString}>{format(date, "LLLL d, yyyy")}</time>
}
