import Loading from "@/components/loading"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import "../styles/global.css"

export default function App({ pageProps }: AppProps) {
  const url = pageProps.allPostsData ? 'index' : 'posts/[id]'
  const DynamicComponentWithNoSSR = dynamic(() => import(`./${url}`), {
    loading: () => <Loading />,
    ssr: false, // 禁用服务器端渲染
  })
  return <DynamicComponentWithNoSSR {...pageProps} />
}
