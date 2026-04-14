import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'

type RouterLike = {
  navigate: (to: string) => Promise<void> | void
}

function toAppPath(urlString: string) {
  const url = new URL(urlString)

  if (url.protocol !== 'gbgr:') {
    return null
  }

  const hostPath = url.host ? `/${url.host}` : ''
  const pathname = url.pathname === '/' ? '' : url.pathname

  return `${hostPath}${pathname}${url.search}${url.hash}` || '/'
}

async function navigateToDeepLink(router: RouterLike, urls: string[] | null) {
  const targetUrl = urls?.[0]
  if (!targetUrl) {
    return
  }

  const path = toAppPath(targetUrl)
  if (!path) {
    return
  }

  await router.navigate(path)
}

export async function initDeepLinkListener(router: RouterLike) {
  try {
    const startUrls = await getCurrent()
    await navigateToDeepLink(router, startUrls)

    return await onOpenUrl(async urls => {
      await navigateToDeepLink(router, urls)
    })
  } catch {
    return () => {}
  }
}
