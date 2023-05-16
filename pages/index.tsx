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
import { Select, Input, Tag, Form, Button, Pagination, Empty } from "antd"
import { categoryToTagMap } from "@/constants"
import { ClearOutlined } from "@ant-design/icons"
import { useRouter } from "next/router"

type PostInfo = {
  [key: string]: any
  id: string
  date: string
  year: number
  title: string
  category?: string | undefined
}

type OptionInfo = {
  label: number
  value: number
}

type SearchParams = {
  year?: number
  blog: string
  category?: string
}

type YearToIndexInfo = {
  [key: string]: number
}

export default function Home({
  allPostsData,
  yearOptions,
}: {
  allPostsData: PostInfo[]
  yearOptions: OptionInfo[]
}) {
  const categoryOptions = [...categoryToTagMap.keys()].map((item) => ({
    label: item,
    value: item,
  }))

  const router = useRouter()

  useEffect(() => {
    const position = router.asPath.indexOf("#")
    if (position === -1) return
    // current=1&pageSize=10
    const hash = router.asPath.slice(position + 1)
    const [currentInfo, sizeInfo] = hash.split("&")
    const [_, current] = currentInfo.split("=")
    const [__, pageSize] = sizeInfo.split("=")
    if (currentInfo && sizeInfo) {
      handlePageChange(+current, +pageSize)
    }
  }, [router.asPath])

  const [pageInfo, setPageInfo] = useState({
    current: 1,
    pageSize: 10,
    total: allPostsData.length,
  })

  const getPostByPage = (
    index: number,
    current = pageInfo.current,
    pageSize = pageInfo.pageSize
  ) => {
    const startPage = (current - 1) * pageSize
    const endPage = startPage + pageSize
    return index >= startPage && index < endPage
  }

  const [postsData, setPostsData] = useState(
    allPostsData.filter(Boolean).filter((_, index) => getPostByPage(index))
  )
  const [searchParams, setSearchParams] = useState({
    year: undefined,
    blog: "",
    category: undefined,
  } as SearchParams)
  const [yearToIndexObj, setYearToIndexObj] = useState({} as YearToIndexInfo)

  useEffect(() => {
    const tmpYearToIndexObj = {} as YearToIndexInfo
    postsData.forEach((item, idx) => {
      if (!tmpYearToIndexObj[item.year]) {
        tmpYearToIndexObj[item.year] = idx + 1
      }
    })
    setYearToIndexObj(tmpYearToIndexObj)
  }, [postsData])

  const getFilterPost = (newSearchParams: SearchParams) => {
    return allPostsData
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
          ? item.category?.includes(newSearchParams.category)
          : true
      )
  }

  const handleSearchChange = (value: string | number, name: string) => {
    const newSearchParams = { ...searchParams, [name]: value }
    setSearchParams(newSearchParams)

    const filterPostData = getFilterPost(newSearchParams)

    setPageInfo({
      ...pageInfo,
      current: 1,
      total: filterPostData.length,
    })
    setPostsData(filterPostData.filter((_, index) => getPostByPage(index, 1)))
  }

  const handlePageChange = (current: number, pageSize: number) => {
    setPageInfo({
      ...pageInfo,
      current,
      pageSize,
    })
    const filterPostData = getFilterPost(searchParams)
    setPostsData(
      filterPostData.filter((_, index) =>
        getPostByPage(index, current, pageSize)
      )
    )
  }

  const reset = () => {
    setSearchParams({
      year: undefined,
      blog: "",
      category: undefined,
    })
    setPageInfo({
      total: allPostsData.length,
      current: 1,
      pageSize: 10,
    })
    setPostsData(
      allPostsData
        .filter(Boolean)
        .filter((_, index) => getPostByPage(index, 1, 10))
    )
  }

  const generateTag = (category: string) => {
    const categoryArr = category.split(",")
    return categoryArr.map((item) => (
      <Tag color={categoryToTagMap.get(item)}>{item}</Tag>
    ))
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
                onChange={(value) => handleSearchChange(value, "year")}
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
                onChange={(e) => handleSearchChange(e.target.value, "blog")}
                placeholder="Please input"
              />
            </Form.Item>
            <Form.Item label="Category">
              <Select
                style={{ width: 120 }}
                onChange={(value) => handleSearchChange(value, "category")}
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
                <div key={id + year + "div"} className={utilStyles.yearItem}>
                  {year}
                </div>
              )}
              <li className={utilStyles.listItem} key={id + year + "li"}>
                <Link
                  href={`/posts/${id}#current=${pageInfo.current}&pageSize=${pageInfo.pageSize}`}
                >
                  {title}
                </Link>
                <br />
                <small className={utilStyles.lightText}>
                  <Date dateString={date} />
                  {category && <div>{generateTag(category)}</div>}
                </small>
              </li>
            </Fragment>
          ))}
          {!postsData.length && <Empty description="Data Not Found"></Empty>}
        </ul>
      </section>
      <Pagination
        className={utilStyles.pagination}
        current={pageInfo.current}
        pageSize={pageInfo.pageSize}
        total={pageInfo.total}
        showTotal={(total) => `Total ${total} items`}
        onChange={handlePageChange}
      />
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
