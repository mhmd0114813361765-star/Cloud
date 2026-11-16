const studentName = sessionStorage.getItem("studentName") || "طالبنا";
document.querySelector("#student-name").textContent = studentName;
document.querySelector("#account-name").textContent = studentName;

const tasks = [...document.querySelectorAll("[data-task]")];
const countLabel = document.querySelector("#completed-count");
const progressLabel = document.querySelector("#plan-progress");

function updateProgress() {
  const completed = tasks.filter((task) => task.getAttribute("aria-pressed") === "true").length;
  countLabel.textContent = `${completed} من ${tasks.length}`;
  progressLabel.textContent = `أنجزت ${completed} من ${tasks.length} مهام`;
}

for (const task of tasks) {
  const isComplete = sessionStorage.getItem(`task-${task.dataset.task}`) === "done";
  task.setAttribute("aria-pressed", String(isComplete));
  task.classList.toggle("is-complete", isComplete);
  task.querySelector(".task-state").textContent = isComplete ? "تمت المهمة" : "إكمال المهمة";

  task.addEventListener("click", () => {
    const nowComplete = task.getAttribute("aria-pressed") !== "true";
    task.setAttribute("aria-pressed", String(nowComplete));
    task.classList.toggle("is-complete", nowComplete);
    task.querySelector(".task-state").textContent = nowComplete ? "تمت المهمة" : "إكمال المهمة";
    sessionStorage.setItem(`task-${task.dataset.task}`, nowComplete ? "done" : "todo");
    updateProgress();
  });
}

updateProgress();

document.querySelector("#logout-button").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.assign("/");
});
