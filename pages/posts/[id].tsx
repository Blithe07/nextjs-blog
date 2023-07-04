import Layout from "../../components/layout"
import { getAllPostIds, getPostData } from "../../lib/posts"
import Head from "next/head"
import DateComp from "../../components/date"
import utilStyles from "../../styles/utils.module.css"
import { CircleDoubleUp } from "@icon-park/react"
import { useEffect, useState } from "react"

export default function Post({
  postData,
}: {
  postData: {
    id: string
    title: string
    date: string
    contentHtml: string
  }
}) {
  const [show, setShow] = useState(false)

  const scrollTotop = () => {
    window.scrollTo({ top: 0 })
    setShow(false)
  }
  const scrollUpIcon = show ? (
    <CircleDoubleUp
      onClick={scrollTotop}
      className={utilStyles.circleDoubleUp}
      theme="outline"
      size="36"
      fill="#333"
    />
  ) : (
    <></>
  )

  useEffect(() => {
    window.addEventListener("scroll", (e: any) => {
      setShow(e.target.lastElementChild.scrollTop !== 0)
    })
  }, [])
  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>
          <DateComp dateString={postData.date} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
      {scrollUpIcon}
    </Layout>
  )
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({
  params,
}: {
  params: {
    id: string
  }
}) {
  const postData = await getPostData(params.id)
  return {
    props: {
      postData,
    },
  }
}
