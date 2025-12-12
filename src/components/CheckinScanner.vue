<template>
    <div class="checkin-scanner">
      <div class="scanner-header">
        <h3>QR Code 報到</h3>
        <div class="scanner-actions">
          <button
            type="button"
            @click="startScanner"
            :disabled="isScanning || starting"
          >
            {{ starting ? '啟動中…' : '啟動掃描' }}
          </button>
          <button
            type="button"
            @click="stopScanner"
            :disabled="!isScanning"
          >
            停止掃描
          </button>
        </div>
      </div>
  
      <div class="scanner-body">
        <div id="qr-reader" class="qr-reader"></div>
      </div>
  
      <div class="scanner-footer">
        <div v-if="lastDecoded" class="last-decoded">
          最後掃描內容：<span>{{ lastDecoded }}</span>
        </div>
        <div v-if="message" :class="['message', { error: isError }]">
          {{ message }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onBeforeUnmount } from 'vue'
  import { Html5Qrcode } from 'html5-qrcode'
  import { checkinWithBarcode, createAttendance } from '../api/attendance'
  
  const props = defineProps({
    // 掃到時是否預設視為「用餐」
    withMealDefault: {
      type: Boolean,
      default: true
    }
  })
  
  // 掃描結束或報到成功時，讓父層可以選擇刷新清單
  const emit = defineEmits(['checked-in'])
  
  const scannerId = 'qr-reader'
  const html5QrCode = ref(null)
  const isScanning = ref(false)
  const starting = ref(false)
  
  const lastDecoded = ref('')
  const lastScanTime = ref(0)
  
  const message = ref('')
  const isError = ref(false)
  
  const synth = window.speechSynthesis || null

  const selectedDate = '2025-12-09'; // 報到當天的日期
  const { data } = await fetchLastWeekList(selectedDate);

  function speak(text) {
    if (!synth) return

    // 建立要念的內容
    const utter = new SpeechSynthesisUtterance(text)

    // 優先找中文語音
    const voices = synth.getVoices()
    const zhVoice =
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh')) ||
      voices[0]

    if (zhVoice) {
      utter.voice = zhVoice
    }

    utter.rate = 1      // 語速
    utter.pitch = 1     // 音高

    // 先把前一次還沒講完的清掉，避免重疊
    synth.cancel()
    synth.speak(utter)
  }

  // 啟動相機 + 掃描(目前沒有使用此功能)
  async function startScanner() {
    if (isScanning.value || starting.value) return
  
    starting.value = true
    message.value = ''
    isError.value = false
  
    try {
      if (!html5QrCode.value) {
        html5QrCode.value = new Html5Qrcode(scannerId)
      }
  
      // 使用環境相機（手機會優先後鏡頭）
      await html5QrCode.value.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250
        },
        onScanSuccess,
        onScanError
      )
  
      isScanning.value = true
    } catch (err) {
      console.error('啟動掃描失敗:', err)
      message.value = '啟動相機失敗，請確認瀏覽器權限或使用 https 網址'
      isError.value = true
    } finally {
      starting.value = false
    }
  }
  
  // 停止掃描
  async function stopScanner() {
    if (!html5QrCode.value || !isScanning.value) return
  
    try {
      await html5QrCode.value.stop()
      await html5QrCode.value.clear()
    } catch (err) {
      console.error('停止掃描失敗:', err)
    } finally {
      isScanning.value = false
    }
  }
  
  // 組件卸載時記得關閉相機
  onBeforeUnmount(() => {
    stopScanner()
  })
  
  // 掃描成功 callback
  async function onScanSuccess(decodedText, decodedResult) {
    const now = Date.now()

    // 只擋「太短時間內」的再次觸發，避免同一畫面抖動
    if (now - lastScanTime.value < 800 && decodedText === lastDecoded.value) {
        return
    }

    lastDecoded.value = decodedText
    lastScanTime.value = now

    await handleCheckin(decodedText)
  }

  
  // 掃描失敗 callback（通常會很多次，這裡不要噴 log 以免洗版）
  function onScanError(errorMessage) {
    // 可以視需要在 debug 時 console.log
    // console.log('scan error', errorMessage)
  }
  
  // 呼叫報到 API
  async function handleCheckin(barcode) {
    try {
        message.value = '報到中…'
        isError.value = false

        // const res = await createAttendance({
        //     barcode: barcode,
        //     with_meal: props.withMealDefault,
        //     source: 'qr'
        // })
        const res = await checkinWithBarcode(barcode, props.withMealDefault)
        const { duplicated, message: serverMsg, attendance } = res.data

        emit('checked-in', attendance || null)

        if (duplicated) {
            speak('重複報到')
            // 這裡你可以選擇是否要真的跳 alert
            alert(attendance.name + (serverMsg || '今日已完成報到'))
            message.value = attendance.name + (serverMsg || '今日已完成報到')
        } else {
            speak('報到成功')
            message.value = attendance.name + (serverMsg || '報到成功')
        }
    } catch (err) {
        speak('報到失敗')
        console.error('checkin error:', err)
        isError.value = true

        const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        '報到失敗'

        message.value = serverMsg
    }
  }

  </script>
  
  <style scoped>
  .checkin-scanner {
    border: 1px solid #bbb;
    border-radius: 8px;
    padding: 12px 16px;
    background: #fdfdfd;
  }
  
  .scanner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .scanner-header h3 {
    margin: 0;
    font-size: 16px;
    color: #224366;
  }
  
  .scanner-actions {
    display: flex;
    gap: 8px;
  }
  
  .scanner-actions button {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #888;
    background: #fff;
    font-size: 13px;
    cursor: pointer;
  }
  
  .scanner-actions button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  
  .scanner-body {
    margin-top: 4px;
  }
  
  .qr-reader {
    width: 100%;
    max-width: 320px;
    min-height: 220px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 0 auto;
    background: #000;
  }
  
  .scanner-footer {
    margin-top: 8px;
    font-size: 13px;
  }
  
  .last-decoded span {
    font-weight: 600;
  }
  
  .message {
    margin-top: 4px;
    color: #2c7a2c;
  }
  
  .message.error {
    color: #c53030;
  }
  </style>
  