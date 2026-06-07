import http from 'node:http'
import https from 'node:https'

const cuhkHost = 'humanum.arts.cuhk.edu.hk'
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

function requestAudio(url, redirectsLeft = 2) {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http
    const request = client.request(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        port: url.port || (isHttps ? 443 : 80),
        protocol: url.protocol,
        method: 'GET',
        agent: isHttps ? httpsAgent : undefined,
        headers: {
          Accept: 'audio/wav,audio/*;q=0.9,*/*;q=0.8',
          'User-Agent': 'ChineseStrokeLearningApp/1.0',
        },
        timeout: 9000,
      },
      (response) => {
        const location = response.headers.location
        if (
          location &&
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          redirectsLeft > 0
        ) {
          response.resume()
          requestAudio(new URL(location, url), redirectsLeft - 1).then(resolve, reject)
          return
        }

        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`CUHK audio returned ${response.statusCode}`))
          return
        }

        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolve({
            body: Buffer.concat(chunks),
            contentType: response.headers['content-type'] || 'audio/wav',
          })
        })
      },
    )

    request.on('timeout', () => {
      request.destroy(new Error('CUHK audio request timed out'))
    })
    request.on('error', reject)
    request.end()
  })
}

export default async function handler(request, response) {
  const syllable = String(request.query.s || '').trim().toLowerCase()

  if (!/^[a-z]+[1-6]$/.test(syllable)) {
    response.status(400).json({ error: 'Invalid Jyutping syllable' })
    return
  }

  const audioPath = `/Lexis/lexi-can/sound/${encodeURIComponent(syllable)}.wav`
  const urls = [
    new URL(`https://${cuhkHost}${audioPath}`),
    new URL(`http://${cuhkHost}${audioPath}`),
  ]

  try {
    let audio
    let lastError

    for (const url of urls) {
      try {
        audio = await requestAudio(url)
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!audio) {
      throw lastError || new Error('CUHK audio unavailable')
    }

    response.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400')
    response.setHeader('Content-Type', audio.contentType)
    response.status(200).send(audio.body)
  } catch (error) {
    console.error(error)
    response.status(502).json({ error: 'CUHK audio unavailable' })
  }
}
