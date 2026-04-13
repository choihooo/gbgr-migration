import { join } from 'node:path'
import { Notification, app, ipcMain } from 'electron'

/**
 * Setup notification IPC handlers
 */
export function setupNotificationHandlers() {
  /* 시스템 알림 표시 핸들러 (실제로 알림 띄우는 역할)*/
  ipcMain.handle(
    'notification:show',
    async (_event, title: string, body: string) => {
      try {
        console.log('🔔 [Notification] 알림 요청 받음:', { title, body })

        /* Notification 권한 확인 */
        if (!Notification.isSupported()) {
          console.warn('❌ [Notification] 시스템 알림이 지원되지 않습니다')
          return { success: false, error: 'Not supported' }
        }

        console.log('✅ [Notification] 시스템 알림 지원됨')

        /* 아이콘 경로 설정 (개발/프로덕션 환경 구분) */
        const iconPath = import.meta.env.DEV
          ? join(app.getAppPath(), 'src', 'main', 'assets', 'Symbol_Logo.png')
          : join(process.resourcesPath, 'Symbol_Logo.png')

        /* 알림 생성 및 표시 */
        const notification = new Notification({
          title,
          body,
          icon: iconPath,
        })

        /* 알림 이벤트 리스너 추가 */
        notification.on('show', () => {
          console.log('✅ [Notification] 알림이 표시되었습니다')
        })

        notification.show()

        return { success: true }
      } catch (error) {
        console.error('❌ [Notification] 알림 표시 실패:', error)
        return { success: false, error: String(error) }
      }
    },
  )

  /* 알림 권한 요청 핸들러(시스템이 알림 기능 사용할 수 있는지 확인) */
  ipcMain.handle('notification:requestPermission', async () => {
    try {
      /* Electron에서는 별도의 권한 요청이 필요하지 않지만,
       시스템 알림이 지원되는지 확인 */
      const isSupported = Notification.isSupported()

      if (import.meta.env.DEV) {
        console.log(`🔔 Notification support: ${isSupported}`)
      }

      return {
        success: true,
        supported: isSupported,
      }
    } catch (error) {
      console.error('Failed to check notification permission:', error)
      return { success: false, error: String(error) }
    }
  })
}
