import { Html5Qrcode } from "html5-qrcode";
import React, { useState, useEffect } from "react";
import "./App.css";
import dingSound from "./ding.mp3";


function App() {
  const [isEnabled, setEnabled] = useState(true);
  const [qrMessage, setQrMessage] = useState("");
  const [playSound, setPlaySound] = useState(false);
  const [scannedSuccessfully, setScannedSuccessfully] = useState(false);
  const [scannedBottles, setScannedBottles] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [hideQRCodeContainer, setHideQRCodeContainer] = useState(false);

  const tg = window.Telegram.WebApp;
  tg.expand();
  tg.enableClosingConfirmation();

  const handleFinishScan = () => {
    tg.sendData([...scannedBottles]);
    setScannedBottles(new Set());
    setIsScanning(false);
    tg.close();
  };

  useEffect(() => {
    const config = { fps: 10, qrbox: { width: 350, height: 250 } };
    const html5QrCode = new Html5Qrcode("qrCodeContainer");

    const qrCodeSuccess = (decodedText) => {
      setQrMessage(decodedText);
      setScannedSuccessfully(true);
      setPlaySound(true);
      tg.HapticFeedback.impactOccurred("heavy");

      setScannedBottles((prevBottles) => {
        const newBottles = new Set(prevBottles);
        newBottles.add(decodedText);
        return newBottles;
      });

      setTimeout(() => {
        setScannedSuccessfully(false);
        setPlaySound(false);
      }, 1500);
    };

    const qrScannerStop = () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then((ignore) => console.log("Scanner stop"))
          .catch((err) => console.log("Scanner error"));
      }
    };

    const backButtonClickHandler = () => {
      // Обработчик для кнопки "Назад" или закрытия приложения
      // Здесь вы можете выполнить необходимые действия перед закрытием приложения
      // Например, отправить данные о сканированных бутылках перед закрытием
      tg.sendData([...scannedBottles]);
    };

    if (isEnabled && !isScanning) {
      html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccess);
      setQrMessage("");
      setIsScanning(true);
      tg.ready();
    } else if (!isEnabled && isScanning) {
      qrScannerStop();
      setIsScanning(false);
    }

    // Добавляем обработчик нажатия кнопки "Назад" или закрытия приложения
    const backButton = tg.BackButton;
    backButton.onClick(backButtonClickHandler);

    // Убираем обработчик при размонтировании компонента
    return () => {
      qrScannerStop();
      backButton.offClick(backButtonClickHandler);
    };
  }, [isEnabled, scannedBottles, isScanning]);

  return (
    <div className="scanner">
      <div id="qrCodeContainer" style={{ display: hideQRCodeContainer ? "none" : "block" }} />
      {scannedSuccessfully && (
        <div className="qr-message">Успешно отсканировано</div>
      )}
      {playSound && <audio src={dingSound} autoPlay />}
      <button className="finish-scan-button" onClick={handleFinishScan}>
        Завершить сканирование
      </button>
      <div className="scanned-count">Отсканировано: {scannedBottles.size}</div>
    </div>
  );
}

export default App;
