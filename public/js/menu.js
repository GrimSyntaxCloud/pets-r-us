const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");
if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menuButton.focus();
    }
  });
  navigation
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  matchMedia("(min-width: 981px)").addEventListener("change", closeMenu);
}
const boop = document.querySelector(".boop");
if (boop) {
  const messages = [
    "One boop. Two very happy pets.",
    "Certified good human. ♡",
    "A tail wag, just for you.",
    "You had us at boop.",
  ];
  let count = 0;
  boop.addEventListener("click", () => {
    document.querySelector("#boop-status").textContent =
      messages[count++ % messages.length];
    const art = document.querySelector(".pet-pals");
    art.classList.remove("booped");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => art.classList.add("booped")),
    );
  });
}
