// 📌 HTML에서 video, canvas, button 요소를 불러옵니다
let video = document.getElementById('video');         // 실시간 카메라 영상 표시용 <video> 요소
const canvas = document.getElementById('canvas');     // 캡처된 이미지를 그릴 <canvas> 요소
const captureBtn = document.getElementById('capture'); // 촬영 버튼
const switchBtn = document.getElementById('switch');   // 카메라 전환 버튼

let currentCamera = 'environment';  // 기본 카메라 방향을 '후면'으로 설정 ('user'는 전면)
let stream = null;                  // 카메라 스트림을 저장할 변수

// 📸 카메라 실행 함수
async function startCamera(facingMode) {
  // 기존에 실행 중인 카메라가 있으면 종료
  if (stream) {
    stream.getTracks().forEach(track => track.stop());  // 각 트랙(비디오 등)을 중지
  }

  try {
    // 카메라 접근을 요청 (video: true면 기본 카메라, facingMode로 방향 설정)
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: facingMode }  // 'environment' → 후면, 'user' → 전면
      },
      audio: false                         // 오디오는 필요 없으므로 비활성화
    });

    // <video> 요소에 스트림 연결해서 영상 출력
    video.srcObject = stream;

  } catch (err) {
    // 카메라가 없거나 접근 실패 시 오류 표시
    console.error("카메라 실행 오류:", err);
    alert("카메라를 시작할 수 없습니다: " + err.message);
  }
}

// 📸 촬영 버튼: 현재 화면을 <canvas>에 복사 (이미지 캡처)
captureBtn.addEventListener('click', () => {
  const context = canvas.getContext('2d');  // 2D 그래픽 컨텍스트 가져오기
  context.drawImage(video, 0, 0, canvas.width, canvas.height);  // 현재 프레임을 캔버스에 그림
  canvas.style.display = "block";          // 캔버스를 화면에 보이게 설정
  alert("이미지 캡처 완료! 분석 기능을 여기에 추가할 수 있습니다.");
});

// 🔄 카메라 전환 버튼: 전면 <-> 후면 카메라 전환
switchBtn.addEventListener('click', () => {
  currentCamera = currentCamera === 'environment' ? 'user' : 'environment';  // 방향 토글
  startCamera(currentCamera);  // 새로운 방향으로 카메라 재시작
});

// 🚀 앱 실행 시 최초 카메라 실행 (후면 카메라 기준)
startCamera(currentCamera);