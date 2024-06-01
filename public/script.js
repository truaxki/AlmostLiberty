document.addEventListener("DOMContentLoaded", function() {
    const hub = document.getElementById('hub');
    const spoke = document.getElementById('spoke');

    const hubRect = hub.getBoundingClientRect();
    const hubCenterX = hubRect.left + hubRect.width / 2;
    const hubCenterY = hubRect.top + hubRect.height / 2;

    spoke.style.left = `${hubCenterX - 10}px`;
    spoke.style.top = `${hubCenterY - 10}px`;

    const radius = (window.innerWidth * 0.75 - window.innerWidth * 0.25) / 2;
    spoke.style.transformOrigin = `-${radius}px 0`;
});
