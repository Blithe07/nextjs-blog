import Loading from "@/components/loading"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import "../styles/global.css"

export default function App({ Component, pageProps }: AppProps) {
  const DynamicComponentWithNoSSR = dynamic(() => import("./index"), {
    loading: () => <Loading />,
    ssr: false, // 禁用服务器端渲染
  })
  return <DynamicComponentWithNoSSR {...pageProps} />
}
