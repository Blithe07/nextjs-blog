import Head from "next/head"
import Image from "next/image"
import Script from "next/script"

import styles from "./layout.module.css"
import utilStyles from "../styles/utils.module.css"
import Link from "next/link"
import ReactCanvasNest from "react-canvas-nest"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

const name = "Blithe"
export const siteTitle = "Blog"

const nestConfig = {
  count: 30,
}

export default function Layout({
  children,
  home,
}: {
  children: JSX.Element[]
  home?: boolean
}) {
  const router = useRouter()

  const [hash, setHash] = useState("")

  useEffect(() => {
    const position = router.asPath.indexOf("#")
    if(position === -1) return
    setHash(router.asPath.slice(position))
  }, [router.asPath])

  return (
    <div className={styles.outerContainer}>
      {!home && (
        <div className={styles.asideContainer}>
          <ReactCanvasNest config={nestConfig} />
        </div>
      )}
      <div className={styles.container}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="Learn how to build a personal website using Next.js"
          />
          <meta
            property="og:image"
            content={`https://og-image.vercel.app/${encodeURI(
              siteTitle
            )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
          />
          <meta name="og:title" content={siteTitle} />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="lazyOnload"
          onLoad={() =>
            console.log(`script loaded correctly, window.FB has been populated`)
          }
        />
        <header className={styles.headerContainer}>
          {home ? (
            <>
              <div className={styles.header}>
                <Image
                  priority
                  src="/images/me.jpg"
                  className={utilStyles.borderSquare}
                  height={144}
                  width={144}
                  alt={name}
                />
                <h1 className={utilStyles.heading2Xl}>{name}</h1>
              </div>
              <section className={utilStyles.headingMd}>
                <p>Name: Lai Tongbin</p>
                <p>Job: web front-end development engineer</p>
                <p>Hobby: 💻 && 🏀 && 📚</p>
              </section>
            </>
          ) : (
            <></>
          )}
        </header>
        <main>{children}</main>
        {!home && (
          <div className={styles.backToHome}>
            <Link href={"/" + hash}>← cd ..</Link>
          </div>
        )}
      </div>
      {!home && (
        <div className={styles.asideContainer}>
          <ReactCanvasNest config={nestConfig} />
        </div>
      )}
    </div>
  )
}
