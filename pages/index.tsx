import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";
import Link from "next/link";
import Date from "../components/date";
import { GetStaticProps } from "next";
import Background from "../components/background";
import dayjs from "dayjs";
import { Fragment, SyntheticEvent, useEffect, useState } from "react";
import { Select, Input } from "antd";
export default function Home({
  allPostsData,
  yearOptions,
}: {
  allPostsData: {
    [key: string]: any;
    id: string;
    date: string;
    year: number;
    title: string;
  }[];
  yearOptions: {
    label: number;
    value: number;
  }[];
}) {
  const [postsData, setPostsData] = useState(allPostsData.filter(Boolean));
  const [searchParams, setSearchParams] = useState({
    year: "",
    blog: "",
  });
  const [yearToIndexObj, setYearToIndexObj] = useState(
    {} as { [key: string]: number }
  );
  useEffect(() => {
    const tmpYearToIndexObj = {} as { [key: string]: number };
    postsData.forEach((item, idx) => {
      if (!tmpYearToIndexObj[item.year]) {
        tmpYearToIndexObj[item.year] = idx + 1;
      }
    });
    setYearToIndexObj(tmpYearToIndexObj);
  }, [postsData]);

  const handleSelectChange = (year: string) => {
    setSearchParams({ ...searchParams, year });
    const filterPostData = allPostsData
      .filter((item) =>
        searchParams.blog
          ? item.title.toLowerCase().includes(searchParams.blog.toLowerCase())
          : true
      )
      .filter((item) => (year ? item.year === +year : true));
    setPostsData(filterPostData);
  };

  const handleInputChange = (e: SyntheticEvent) => {
    const blog = (e.target as HTMLInputElement).value;
    setSearchParams({
      ...searchParams,
      blog,
    });

    const filterPostData = allPostsData
      .filter((item) =>
        searchParams.year ? item.year === +searchParams.year : true
      )
      .filter((item) =>
        blog ? item.title.toLowerCase().includes(blog.toLowerCase()) : true
      );

    setPostsData(filterPostData);
  };
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
            value={searchParams.year}
            options={yearOptions}
            allowClear
            placeholder="select"
          />
          <Input
            value={searchParams.blog}
            style={{ width: 120 }}
            onChange={handleInputChange}
            placeholder="input"
          />
        </div>
        <ul className={utilStyles.list}>
          {postsData.map(({ id, date, title, year }, idx) => (
            <Fragment key={id + year}>
              {yearToIndexObj[year] === idx + 1 && (
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
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData();
  const yearSet = new Set<number>();
  allPostsData.forEach((item) => {
    const year = dayjs(item.date).year();
    item.year = year;
    yearSet.add(year);
  });
  const yearOptions = [...yearSet.values()];
  return {
    props: {
      allPostsData,
      yearOptions: yearOptions.map((year) => ({ label: year, value: year })),
    },
  };
};
