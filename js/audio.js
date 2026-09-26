/**
 * 「此刻」原生 Web Audio 白噪音合成引擎 (Zero External Assets)
 * 采用 Web Audio API 纯算法合成雨声、海浪、白噪音，零网络依赖，永久离线可用
 */

window.CiKeAudio = (function() {
    let audioCtx = null;
    let currentSource = null;
    let gainNode = null;
    let lfoNode = null;
    let isPlaying = false;
    let currentType = 'none'; // 'none' | 'rain' | 'waves' | 'white'

    function initContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function createWhiteNoiseBuffer() {
        if (!audioCtx) return null;
        const bufferSize = audioCtx.sampleRate * 2; // 2秒循环
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    function createPinkNoiseBuffer() {
        if (!audioCtx) return null;
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        return buffer;
    }

    function stop() {
        if (currentSource) {
            try {
                currentSource.stop();
                currentSource.disconnect();
            } catch (e) {}
            currentSource = null;
        }
        if (lfoNode) {
            try {
                lfoNode.stop();
                lfoNode.disconnect();
            } catch (e) {}
            lfoNode = null;
        }
        isPlaying = false;
        currentType = 'none';
    }

    function play(type, volume = 0.4) {
        initContext();
        if (!audioCtx) return;

        stop();
        if (type === 'none') return;

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);

        const noiseBuffer = (type === 'rain' || type === 'waves') ? createPinkNoiseBuffer() : createWhiteNoiseBuffer();
        if (!noiseBuffer) return;

        const source = audioCtx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        if (type === 'rain') {
            // 雨声：带通滤波 + 高频滚降
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
            source.connect(filter);
            filter.connect(gainNode);
        } else if (type === 'waves') {
            // 海浪：用极慢的低频振荡器(LFO)调制滤波器频率模拟潮涨潮落
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, audioCtx.currentTime);

            const lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime); // ~8秒一波海浪
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(350, audioCtx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            lfoNode = lfo;

            source.connect(filter);
            filter.connect(gainNode);
        } else {
            // 平缓白噪音
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2500, audioCtx.currentTime);
            source.connect(filter);
            filter.connect(gainNode);
        }

        source.start();
        currentSource = source;
        isPlaying = true;
        currentType = type;
    }

    function setVolume(val) {
        if (gainNode && audioCtx) {
            gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
        }
    }

    /**
     * 番茄钟完成提示音（纯算法合成，零音频资源）
     * @param {'focus-done'|'break-done'} kind 阶段类型
     */
    function chime(kind = 'focus-done') {
        initContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        // 专注结束：上行三音（明亮、收获感）；休息结束：温和双音（唤醒感）
        const notes = kind === 'break-done' ? [659.25, 987.77] : [523.25, 659.25, 783.99];

        notes.forEach((freq, i) => {
            const startAt = now + i * 0.18;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.linearRampToValueAtTime(0.22, startAt + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(startAt);
            osc.stop(startAt + 1.2);
        });
    }

    /**
     * 答题反馈音（零资源算法合成）
     * @param {'correct'|'wrong'|'levelup'} kind
     * 设计原则：答错不刺耳、不惩罚，只是轻轻提示"再想想"
     */
    function feedback(kind = 'correct') {
        initContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        let notes, type, peak, dur;
        if (kind === 'wrong') {
            notes = [311.13, 261.63];      // 柔和下行双音（降三度），不刺耳
            type = 'sine';
            peak = 0.14;
            dur = 0.5;
        } else if (kind === 'levelup') {
            notes = [523.25, 659.25, 783.99, 1046.5];
            type = 'triangle';
            peak = 0.2;
            dur = 1.0;
        } else {
            notes = [783.99, 1046.5];      // 轻快上行双音
            type = 'sine';
            peak = 0.18;
            dur = 0.42;
        }

        notes.forEach((freq, i) => {
            const startAt = now + i * 0.09;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.linearRampToValueAtTime(peak, startAt + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(startAt);
            osc.stop(startAt + dur + 0.05);
        });
    }

    return {
        play,
        stop,
        setVolume,
        chime,
        feedback,
        getCurrentType: () => currentType,
        isPlaying: () => isPlaying
    };
})();
