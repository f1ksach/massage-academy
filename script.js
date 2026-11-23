
"use strict";

// TELEGRAM
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

// ТЕСТОВЫЕ ВИДЕОУРОКИ
const courses = [
  {
    id: 1,
    title: "Массаж спины для начинающих",
    description: "Основные техники и правильная последовательность массажа.",
    price: 299,
    duration: "25 минут",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"
  },
  {
    id: 2,
    title: "Массаж шейно-воротниковой зоны",
    description: "Обучение базовым техникам работы с шеей и плечами.",
    price: 399,
    duration: "35 минут",
    image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800"
  },
  {
    id: 3,
    title: "Расслабляющий массаж",
    description: "Приёмы для комфортного расслабляющего массажа.",
    price: 249,
    duration: "30 минут",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800"
  }
];

// ЛОКАЛЬНОЕ ХРАНИЛИЩЕ (ТОЛЬКО ДЕМО)
const STORAGE_KEY = "massage_academy_demo";

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && typeof saved === "object") {
      return {
        balance: Number(saved.balance) || 0,
        purchased: Array.isArray(saved.purchased)
          ? saved.purchased
          : [],
        transactions: Array.isArray(saved.transactions)
          ? saved.transactions
          : []
      };
    }
  } catch (error) {
    console.warn("Ошибка загрузки данных", error);
  }

  return {
    balance: 0,
    purchased: [],
    transactions: []
  };
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function money(amount) {
  return Number(amount).toLocaleString("uk-UA");
}

// ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
function openPage(pageId) {
  const target = document.getElementById(pageId);
  if (!target) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  window.scrollTo(0, 0);
}

// СОЗДАНИЕ КАРТОЧКИ УРОКА
function createCourseCard(course) {
  const owned = data.purchased.includes(course.id);

  const card = document.createElement("article");
  card.className = "course-card";

  const img = document.createElement("img");
  img.className = "course-image";
  img.src = course.image;
  img.alt = course.title;
  img.loading = "lazy";

  const content = document.createElement("div");
  content.className = "course-content";

  const title = document.createElement("h3");
  title.textContent = course.title;

  const description = document.createElement("p");
  description.textContent =
    course.description + " · " + course.duration;

  const footer = document.createElement("div");
  footer.className = "course-footer";

  const price = document.createElement("span");
  price.className = "course-price";
  price.textContent = owned ? "Куплено" : money(course.price) + " ₴";

  const button = document.createElement("button");
  button.className = "buy-btn";
  button.textContent = owned ? "Смотреть" : "Купить";

  button.addEventListener("click", () => {
    if (owned) {
      alert("Демо: здесь откроется купленный видеоурок.");
    } else {
      buyCourse(course.id);
    }
  });

  footer.append(price, button);
  content.append(title, description, footer);
  card.append(img, content);

  return card;
}

// КАТАЛОГ
function renderCourses() {
  const catalog = document.getElementById("course-list");
  const featured = document.getElementById("featured-courses");
  const myCourses = document.getElementById("my-courses");

  catalog.replaceChildren();
  featured.replaceChildren();
  myCourses.replaceChildren();

  courses.forEach(course => {
    catalog.appendChild(createCourseCard(course));
  });

  courses.slice(0, 2).forEach(course => {
    featured.appendChild(createCourseCard(course));
  });

  const owned = courses.filter(course =>
    data.purchased.includes(course.id)
  );

  if (owned.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "У вас пока нет покупок";
    myCourses.appendChild(empty);
  } else {
    owned.forEach(course => {
      myCourses.appendChild(createCourseCard(course));
    });
  }
}

// ПОПОЛНЕНИЕ ТЕСТОВОГО КОШЕЛЬКА
function topUp() {
  const input = prompt(
    "ДЕМО-ПОПОЛНЕНИЕ\nВведите сумму в гривнах:",
    "500"
  );

  if (input === null) return;

  const amount = Number(input.trim());

  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > 10000
  ) {
    alert("Введите целую сумму от 1 до 10000 грн.");
    return;
  }

  data.balance += amount;

  data.transactions.unshift({
    type: "Пополнение (демо)",
    amount: amount,
    date: new Date().toLocaleString("uk-UA")
  });

  saveData();
  renderAll();

  alert("Тестовый баланс пополнен на " + money(amount) + " ₴");
}

// ПОКУПКА УРОКА
function buyCourse(id) {
  const course = courses.find(item => item.id === id);

  if (!course) return;

  if (data.purchased.includes(id)) {
    alert("Этот урок уже куплен.");
    return;
  }

  if (data.balance < course.price) {
    alert("Недостаточно средств. Пополните тестовый баланс.");
    openPage("wallet");
    return;
  }

  const confirmed = confirm(
    "Купить «" + course.title + "» за " +
    money(course.price) + " ₴?"
  );

  if (!confirmed) return;

  data.balance -= course.price;
  data.purchased.push(id);

  data.transactions.unshift({
    type: "Покупка: " + course.title,
    amount: -course.price,
    date: new Date().toLocaleString("uk-UA")
  });

  saveData();
  renderAll();

  alert("Урок куплен! Найдите его в профиле.");
}

// ИСТОРИЯ ОПЕРАЦИЙ
function renderTransactions() {
  const container = document.getElementById("transactions");
  container.replaceChildren();

  if (data.transactions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = "Операций пока нет";
    container.appendChild(empty);
    return;
  }

  data.transactions.forEach(item => {
    const row = document.createElement("div");
    row.className = "transaction";

    const details = document.createElement("div");

    const name = document.createElement("div");
    name.textContent = item.type;

    const date = document.createElement("small");
    date.textContent = item.date;

    details.append(name, date);

    const amount = document.createElement("strong");
    amount.className =
      item.amount > 0 ? "positive" : "negative";

    amount.textContent =
      (item.amount > 0 ? "+" : "") +
      money(item.amount) + " ₴";

    row.append(details, amount);
    container.appendChild(row);
  });
}

// ПРОФИЛЬ TELEGRAM
function renderProfile() {
  const user = tg?.initDataUnsafe?.user;

  if (!user) {
    document.getElementById("profile-name").textContent =
      "Гость (демо)";
    return;
  }

  document.getElementById("profile-name").textContent =
    [user.first_name, user.last_name].filter(Boolean).join(" ");

  document.getElementById("profile-id").textContent =
    "Telegram ID: " + user.id;
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function renderAll() {
  document.querySelectorAll(".balance-value").forEach(el => {
    el.textContent = money(data.balance);
  });

  renderCourses();
  renderTransactions();
  renderProfile();
}

// ОБРАБОТЧИКИ КНОПОК
document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

document.getElementById("topup-btn")
  .addEventListener("click", topUp);

// ЗАПУСК
renderAll();
