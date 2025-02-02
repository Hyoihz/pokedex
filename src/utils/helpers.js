let spinnerInstance = null;

function createSpinner() {
    const container = document.createElement("div");
    container.className = "spinner-container";

    container.innerHTML = `
    <svg class="spinner" width="36px" height="36px" viewBox="0 0 66 66">
      <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>
  `;

    return container;
}

export function showSpinner() {
    if (!spinnerInstance) {
        spinnerInstance = createSpinner();
        document.body.appendChild(spinnerInstance);
    }
}

export function hideSpinner() {
    if (spinnerInstance) {
        spinnerInstance.remove();
        spinnerInstance = null;
    }
}

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const leadZeroPad = (num, length) => {
    return num.toString().padStart(length, "0");
};
