import Head from "next/head"
import Layout, { siteTitle } from "../components/layout"
import utilStyles from "../styles/utils.module.css"
import { getSortedPostsData } from "../lib/posts"
import Link from "next/link"
import Date from "../components/date"
import { GetStaticProps } from "next"
import Background from "../components/background"
import dayjs from "dayjs"
import { Fragment, SyntheticEvent, useEffect, useState } from "react"
import { Select, Input } from "antd"
export default function Home({
  allPostsData,
}: {
  allPostsData: {
    [key: string]: any
    id: string
    date: string
    year: number
  }[]
}) {
  const yearSet = new Set<{ label: number; value: number }>()
  const yearToIndexObj = {} as { [key: string]: number }
  allPostsData.forEach((item, idx) => {
    const year = dayjs(item.date).year()
    item.year = year
    yearSet.add({ label: year, value: year })
    if (!yearToIndexObj[year]) {
      yearToIndexObj[year] = idx + 1
    }
  })

  const [postsData, setPostsData] = useState(allPostsData.filter(Boolean))
  const [year, setYear] = useState("")
  const [blog, setBlog] = useState("")
  const [yearToIndex, setYearToIndex] = useState(yearToIndexObj)

  useEffect(() => {
    postsData.forEach((item, idx) => {
      const year = dayjs(item.date).year()
      setYearToIndex({
        ...yearToIndex,
        [year]: idx + 1,
      })
    })
  }, [postsData])

  const handleSelectChange = (value: string) => {
    setYear(value)
    setPostsData(
      allPostsData.filter((item) => (!value ? true : item.year === +value))
    )
  }

  const handleInputChange = (e: SyntheticEvent) => {
    setBlog((e.target as HTMLInputElement).value)
    setPostsData(
      allPostsData.filter((item) =>
        !(e.target as HTMLInputElement).value
          ? true
          : item.title.includes((e.target as HTMLInputElement).value)
      )
    )
  }
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Background />
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <div className={utilStyles.headingLg}>
          <Select
            style={{ width: 120, marginRight: "10px" }}
            onChange={handleSelectChange}
            value={year}
            options={[...yearSet.values()]}
            allowClear
            placeholder="select"
          />
          <Input
            value={blog}
            style={{ width: 120 }}
            onChange={handleInputChange}
            placeholder="input"
          />
        </div>
        <ul className={utilStyles.list}>
          {postsData.map(({ id, date, title, year }, idx) => (
            <Fragment key={id + year}>
              {yearToIndex[year] === idx + 1 && (
                <div className={utilStyles.yearItem}>{year}</div>
              )}
              <li className={utilStyles.listItem}>
                <Link href={`/posts/${id}`}>{title}</Link>
                <br />
                <small className={utilStyles.lightText}>
                  <Date dateString={date} />
                </small>
              </li>
            </Fragment>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData,
    },
  }
}
