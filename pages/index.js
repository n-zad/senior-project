import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>I'm building this web app for my Senior Project</p>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Start Streaming</h2>
        <Link href={`/host-stream`}>Over Here</Link> (or use the{" "}
        <Link href={`/host-stream-complex`}>complex version</Link>)
        <h2 className={utilStyles.headingLg}>Listen to Recent Streams</h2>
        <Link href={`/view-streams`}>View Streams</Link>
      </section>
    </Layout>
  );
}
