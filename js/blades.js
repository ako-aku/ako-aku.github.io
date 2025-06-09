(function blades() {
    const bladesSettings = {
        patternSize: 620,
        patternAlpha: 26.66,
        patternRefreshInterval: 2,
        patternScale: 1
    };

    /*
    const bladesSettings = {
      patternSize: 320,
      patternAlpha: 8,
      patternRefreshInterval: 2,
      patternScale: 1 
    };
    */

    const canvas = document.querySelector(".blades");
    const ctx = canvas.getContext("2d");
    let frame = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function updatePattern() {
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = bladesSettings.patternSize;
        patternCanvas.height = bladesSettings.patternSize;
        const pctx = patternCanvas.getContext("2d");
        const patternData = pctx.createImageData(bladesSettings.patternSize, bladesSettings.patternSize);
        for (let i = 0; i < bladesSettings.patternSize * bladesSettings.patternSize * 4; i += 4) {
            const v = Math.random() * 255;
            patternData.data[i] = v;
            patternData.data[i + 1] = v;
            patternData.data[i + 2] = v;
            patternData.data[i + 3] = bladesSettings.patternAlpha;
        }
        pctx.putImageData(patternData, 0, 0);
        return ctx.createPattern(patternCanvas, "repeat");
    }

    let pattern = updatePattern();

    function draw() {
        if (frame % bladesSettings.patternRefreshInterval === 0) {
            pattern = updatePattern();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.setTransform(bladesSettings.patternScale, 0, 0, bladesSettings.patternScale, 0, 0);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width / bladesSettings.patternScale, canvas.height / bladesSettings.patternScale);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.restore();
        frame++;
        requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    resize();
    draw();
})();