let API_KEY = window.localStorage.getItem("todoistToken") || ""

const promptApiKey = () => prompt("Please add your Todoist API token to the js file. You can find your token from the Integrations page of your account.", "")
const updateApiKey = (newVal) => {
    window.localStorage.setItem("todoistToken", newVal)
    API_KEY = newVal
}

while (API_KEY.length < 1) {
    updateApiKey(promptApiKey())
}

const API_ENDPOINT = "https://api.todoist.com/rest/v1"

const calendar = document.querySelector("#calendar")
const main = document.querySelector("main")
let numRows = 0

const dateToTodoistFilterString = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

const parseTodoistApiDate = (dateString) => {
    return new Date(dateString)
}

const addDays = (date, days) => {
    let result = new Date(date)
    result.setDate(date.getDate() + days)
    return result
}

const getTasksByFilterString = async (filterString) => {
    const tasksEndpoint = API_ENDPOINT + '/tasks?filter=' + filterString
    try {
        const repsonse = await fetch(tasksEndpoint, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`
            }
        })
        const tasks = await repsonse.json()
        return tasks.map((task) => {
            return {
                taskName: task.content,
                priority: 5 - task.priority,
                url: task.url,
                due: parseTodoistApiDate(task.due.date),
                recurring: task.due.recurring,
                dateString: task.due.string
            }
        })
    } catch (err) {
        console.log("Error getting tasks: " + err)
        return []
    }
}

const getTasksByDueDate = async (date) => {
    const filterString = dateToTodoistFilterString(date)
    return await getTasksByFilterString(filterString)
}

const getDateColumn = async (date) => {
    const section = document.createElement('section')
    const heading = document.createElement("h2")
    section.appendChild(heading)
    const ul = document.createElement("ul")
    
    const tasks = (await getTasksByDueDate(date)).sort((tA, tB) => tA.priority - tB.priority)
    const headingText = document.createTextNode(date.toDateString() + ` (${tasks.length})`)
    heading.appendChild(headingText)
    tasks.forEach(task => {
        const li = document.createElement("li")
        li.className = "p" + task.priority
        const text = document.createTextNode(task.taskName)
        li.appendChild(text)
        ul.appendChild(li)
    })

    section.appendChild(ul)
    return section
}

const renderWeekTable = async (startDate) => {
    const dates = [startDate]
    for (let i = 1; i < 7; i++) {
        dates.push(addDays(startDate, i))
    }
    const row = document.createElement("div")
    row.className = "row"

    for (const date of dates) {
        const col = await getDateColumn(date)
        row.appendChild(col)
    }
    calendar.appendChild(row)

    numRows++
}

const renderNextButton = async () => {
    const buttonText = document.createTextNode("Show another week")
    const button = document.createElement("button")
    button.appendChild(buttonText)
    button.addEventListener("click", () => renderWeekTable(addDays(new Date(), 7 * numRows)))
    main.appendChild(button)
}

const resetTable = () => {
    while (calendar.firstChild) {
        calendar.removeChild(calendar.lastChild);
    }
    renderWeekTable(new Date())
}

const renderApiButton = async () => {
    const buttonText = document.createTextNode("Re-enter your API token.")
    const button = document.createElement("button")
    button.appendChild(buttonText)
    button.addEventListener("click", () => {
        updateApiKey(promptApiKey())
        resetTable()
    })
    main.appendChild(button)
}

renderWeekTable(new Date())
renderNextButton()
renderApiButton()
