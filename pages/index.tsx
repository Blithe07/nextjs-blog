import Head from "next/head"
import Layout, { siteTitle } from "../components/layout"
import utilStyles from "../styles/utils.module.css"
import { getSortedPostsData } from "../lib/posts"
import Link from "next/link"
import Date from "../components/date"
import { GetStaticProps } from "next"
import Background from "../components/background"
import dayjs from "dayjs"
import { Fragment, useEffect, useState } from "react"
import { Select, Input, Tag, Form, Button } from "antd"
import { categoryToTagMap } from "@/constants"
import { ClearOutlined } from "@ant-design/icons"
export default function Home({
  allPostsData,
  yearOptions,
}: {
  allPostsData: {
    [key: string]: any
    id: string
    date: string
    year: number
    title: string
    category?: string
  }[]
  yearOptions: {
    label: number
    value: number
  }[]
}) {
  const categoryOptions = [...categoryToTagMap.keys()].map((item) => ({
    label: item,
    value: item,
  }))
  const [postsData, setPostsData] = useState(allPostsData.filter(Boolean))
  const [searchParams, setSearchParams] = useState({
    year: undefined as number | undefined,
    blog: "",
    category: undefined as string | undefined,
  })
  const [yearToIndexObj, setYearToIndexObj] = useState(
    {} as { [key: string]: number }
  )
  useEffect(() => {
    const tmpYearToIndexObj = {} as { [key: string]: number }
    postsData.forEach((item, idx) => {
      if (!tmpYearToIndexObj[item.year]) {
        tmpYearToIndexObj[item.year] = idx + 1
      }
    })
    setYearToIndexObj(tmpYearToIndexObj)
  }, [postsData])

  const handleChange = (value: string | number, name: string) => {
    const newSearchParams = { ...searchParams, [name]: value }
    setSearchParams(newSearchParams)

    const filterPostData = allPostsData
      .filter((item) =>
        newSearchParams.blog
          ? item.title
              .toLowerCase()
              .includes(newSearchParams.blog.toLowerCase())
          : true
      )
      .filter((item) =>
        newSearchParams.year ? item.year === newSearchParams.year : true
      )
      .filter((item) =>
        newSearchParams.category
          ? item.category === newSearchParams.category
          : true
      )

    setPostsData(filterPostData)
  }

  const reset = () => {
    setSearchParams({
      year: undefined as number | undefined,
      blog: "",
      category: undefined as string | undefined,
    })
    setPostsData(allPostsData)
  }

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <Background />
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <div className={utilStyles.headingLg}>
          <Form initialValues={searchParams} layout="inline">
            <Form.Item label="Year:">
              <Select
                style={{ width: 120 }}
                onChange={(value) => handleChange(value, "year")}
                value={searchParams.year}
                options={yearOptions}
                showSearch
                allowClear
                placeholder="Please select"
              />
            </Form.Item>
            <Form.Item label="Blog">
              <Input
                value={searchParams.blog}
                style={{ width: 120 }}
                onChange={(e) => handleChange(e.target.value, "blog")}
                placeholder="Please input"
              />
            </Form.Item>
            <Form.Item label="Category">
              <Select
                style={{ width: 120 }}
                onChange={(value) => handleChange(value, "category")}
                value={searchParams.category}
                options={categoryOptions}
                showSearch
                allowClear
                placeholder="Please select"
              />
            </Form.Item>
          </Form>
          <Button icon={<ClearOutlined />} onClick={reset}>
            reset
          </Button>
        </div>
        <ul className={utilStyles.list}>
          {postsData.map(({ id, date, title, year, category }, idx) => (
            <Fragment key={id + year}>
              {yearToIndexObj[year] === idx + 1 && (
                <div className={utilStyles.yearItem}>{year}</div>
              )}
              <li className={utilStyles.listItem}>
                <Link href={`/posts/${id}`}>{title}</Link>
                <br />
                <small className={utilStyles.lightText}>
                  <Date dateString={date} />
                  {category && (
                    <Tag color={categoryToTagMap.get(category)}>{category}</Tag>
                  )}
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
  const yearSet = new Set<number>()
  allPostsData.forEach((item) => {
    const year = dayjs(item.date).year()
    item.year = year
    yearSet.add(year)
  })
  const yearOptions = [...yearSet.values()]
  return {
    props: {
      allPostsData,
      yearOptions: yearOptions.map((year) => ({ label: year, value: year })),
    },
  }
}
