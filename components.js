class CheckSwitch extends HTMLElement {
    #innerValue = false;

    constructor() {
        super();

        this.attachShadow({ mode: "open" });
        const defaultValue = this.getAttribute("default");

        const html = /*html*/ `
            <button><span></span></button>
        `;

        const css = /*css*/ `
            button {
                display: inline-block;
                position: relative;
                border: none;
                height: 1.5em;
                width: 2.5em;
                vertical-align: baseline;
                border-radius: 999px;
                cursor: pointer;
                transition: background-color 0.3s ease;

                span {
                    position: absolute;
                    top: 0.25em;
                    height: 1em;
                    width: 1em;
                    background-color: #fff;
                    border-radius: 999px;
                    transition: left 0.3s ease;
                }
            }
        `;

        this.shadowRoot.innerHTML = html + `<style>${css}</style>`;

        if (defaultValue === "1" || defaultValue === "true") {
            this.#innerValue = true;
        }

        this.shadowRoot.querySelector("button").addEventListener("click", (_event) => {
            this.#innerValue = !this.#innerValue;
            this.#clicked();
        });

        this.#clicked(false);
    }

    #clicked(fireEvent = true) {
        if (fireEvent) {
            const newEvent = new Event("input");
            this.dispatchEvent(newEvent);
        }

        const span = this.shadowRoot.querySelector("span");
        const button = this.shadowRoot.querySelector("button");

        if (this.#innerValue) {
            span.style.left = "1.25em";
            button.style.backgroundColor = "#86d9ff";
        } else {
            span.style.left = "0.25em";
            button.style.backgroundColor = "#bbbbbb";
        }
    }

    get value() {
        return this.#innerValue;
    }

    set value(newValue) {
        if (newValue === this.#innerValue) {
            return;
        }

        this.#innerValue = !!newValue;
        this.#clicked(false);
    }
}

customElements.define("check-switch", CheckSwitch);
