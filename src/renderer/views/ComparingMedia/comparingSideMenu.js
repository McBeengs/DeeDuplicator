const separator = {
    template: `<hr style="border-color: gray; margin: 5px 20px;">`
}

export const Menu = [
    {
        header: true,
        title: 'Change View',
        id: 'ignore',
        hiddenOnCollapse: true
    },
    {
        title: 'List all files on a Grid',
        icon: 'fas fa-list',
        id: 'grid'
    },
    {
        title: 'List all Groups',
        icon: 'fas fa-layer-group',
        id: 'group'
    },
    {
        title: 'Compare Group by Group',
        icon: 'fas fa-clone',
        id: 'eachGroup'
    },
    {
        component: separator,
        id: 'ignore'
    },
    {
        header: true,
        title: 'Media Options',
        id: 'ignore',
        hiddenOnCollapse: true
    },
    {
        title: 'Check files by criteria',
        icon: 'far fa-check-square',
        id: 'ignore',
        child: [
            // {
            //     title: "Apply custom rule",
            //     icon: 'fas fa-scroll',
            //     id: 'customRule'
            // },
            {
                title: "Custom select FA and stuff",
                id: 'fa'
            },
            {
                title: "Custom select BBW and stuff",
                id: 'bbw'
            },
            {
                component: separator,
                id: 'ignore'
            },
            {
                title: "Biggest size on group",
                icon: 'fas fa-sort-numeric-up-alt',
                id: 'biggestSize'
            },
            {
                title: "Smallest size on group",
                icon: 'fas fa-sort-numeric-down',
                id: 'smallestSize'
            },
            {
                title: "Longest path on group",
                icon: 'fas fa-sort-amount-up',
                id: 'longestPath'
            },
            {
                title: "Shortest path on group",
                icon: 'fas fa-sort-amount-down-alt',
                id: 'shortestPath'
            },
            {
                title: "Newest file on group",
                icon: 'fas fa-calendar-plus',
                id: 'newestFile'
            },
            {
                title: "Oldest file on group",
                icon: 'fas fa-calendar-minus',
                id: 'oldestFile'
            },
            {
                title: "Uncheck all",
                icon: 'fas fa-calendar-minus',
                id: 'unselectAll'
            },
        ]
    },
    {
        title: "Go back home",
        icon: 'fas fa-home',
        id: 'goHome'
    },
    {
        title: "Finish comparison",
        icon: 'fas fa-check',
        id: 'finish'
    }
]