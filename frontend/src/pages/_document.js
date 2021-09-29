import {
  default as NextDocument,
  Html,
  Head,
  Main,
  NextScript
} from 'next/document';
import { oneLineTrim } from 'common-tags';

class Document extends NextDocument {
  static async getInitialProps(ctx) {
    const initialProps = await NextDocument.getInitialProps(ctx);
    // HSTS
    if (ctx.res) {
      ctx.res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" type="image/png" href="/favicon.png" />
          {/* This is so loading all.js outside of JIRA IFrame doesn't bomb the page */}
          {process.env.NODE_ENV === 'development' && (
            <script
              dangerouslySetInnerHTML={{
                __html: oneLineTrim`
                    if (!window.name) {
                        window.name = '{"crev":"1.2.20"}';
                    }  
                `
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
