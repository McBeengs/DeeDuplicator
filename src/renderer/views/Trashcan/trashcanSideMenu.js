const separator = {
    template: `<hr style="border-color: gray; margin: 5px 20px;">`
}

export const Menu = [
    {
        header: true,
        title: 'Trashcan',
        id: 'ignore',
        hiddenOnCollapse: true
    },
    {
        title: 'Empty trashcan',
        icon: 'fas fa-trash',
        id: 'deleteAll'
    },
    {
        title: 'Spare all the files',
        icon: 'fas fa-eraser',
        id: 'spareAll'
    },
    {
        component: separator,
        id: 'ignore'
    },
    {
        title: "Go back home",
        icon: 'fas fa-home',
        id: 'goHome'
    }
]