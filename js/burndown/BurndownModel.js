(function(models)
{
    var self;

    function BurndownModel()
    {
        this.burndownConfig = {
            type: "dayToDay",
            workingDays: [],
            lines: []
        };

        this.dataSets = {};
        this.dataSetsEstimates = {};
        this.userStories = [];
        this.sprintDailyBurn = {};
        this.workersImplication = {};
        this.ignoredSubtasks = [];
        this.commitmentIssues = [];
    }

    Object.defineProperties(BurndownModel.prototype,
    {
        onLoad: {
            value: function(data)
            {
                self = this;
                
                if (data.workersImplication) self.burndownConfig.workersImplication = data.workersImplication;
                if (data.ignoredSubtasks) self.ignoredSubtasks = data.ignoredSubtasks;
                if (data.resources) self.parseResourcesToDailyBurn(data.resources);
                if (data.userStories) self.parteUserStoriesToUSClosureDates(data.userStories);
                if (data.sprintDailyBurn) self.sprintDailyBurn = data.sprintDailyBurn;
                if (data.visibleCharts) self.visibleCharts = data.visibleCharts;

                // Load saved burndown dataSets if exist
                if (data.dataSets)
                {
                    if (data.dataSets.globalBurndown) self.dataSets.globalBurndown = data.dataSets.globalBurndown;
                    if (data.dataSets.implementationTasksBurndown) self.dataSets.implementationTasksBurndown = data.dataSets.implementationTasksBurndown;
                    if (data.dataSets.qaTasksBurndown) self.dataSets.qaTasksBurndown = data.dataSets.qaTasksBurndown;
                    if (data.dataSets.testAutoTasksBurndown) self.dataSets.testAutoTasksBurndown = data.dataSets.testAutoTasksBurndown;
                }
            },
            enumerable: false
        },
        onSave: {
            value: function(data)
            {
                self = this;
                if (data.resources) self.parseResourcesToDailyBurn(data.resources);
                if (data.userStories) self.parteUserStoriesToUSClosureDates(data.userStories);
                if (self.ignoredSubtasks) data.ignoredSubtasks = self.ignoredSubtasks;
            },
            enumerable: false
        },
        onSettingsLoaded : {
            value: function(settings)
            {
                this.burndownConfig.type = settings.burndown.type;
                this.burndownConfig.lines = settings.burndown.lines || [];
            },
            enumerable: false
        },
        onSprint : {
            value: function(data)
            {
                this.burndownConfig.workingDays = self.calcBusinessDays(self.sprint.startDate, self.sprint.endDate);
            },
            enumerable: false
        },
        calcBusinessDays : {
            value: function(startDate, endDate)
            {
                var day = moment(startDate);
                var businessDays = new Array();

                while (day.isSameOrBefore(endDate,'day'))
                {
                    if (day.day()!=0 && day.day()!=6)
                    {
                        businessDays.push(day.format('DD/MM/YYYY'));
                    }
                    day.add(1,'d');
                }
                
                return businessDays;
            },
            enumerable: false
        },
        parseResourcesToDailyBurn : {
            value : function(resources)
            {
                const HOURS_PER_DAY = 6;
                var sprintDailyBurn = {};

                $.each(resources, function(lineName, lineData)  // lineName es la clave (ej: "burndownEstimate")
                {
                    if (!sprintDailyBurn[lineName]) sprintDailyBurn[lineName] = [];

                    $.each(lineData, function(workerName, workerDays)  // workerName es la clave, workerDays es el array
                    {        
                        const workerImplication = self.burndownConfig.workersImplication && self.burndownConfig.workersImplication[workerName] || 100;
                        const hoursPerDay = HOURS_PER_DAY * workerImplication / 100;                    
                        $.each(workerDays, function(dayIndex, day)  // dayIndex es el índice, day es el objeto
                        {
                            if (!sprintDailyBurn[lineName][dayIndex]) 
                                sprintDailyBurn[lineName][dayIndex] = 0;
                            
                            var workerDayHours = 0;
                            
                            if (day.type == "full") workerDayHours += hoursPerDay;
                            else if (day.type == "mid") workerDayHours += hoursPerDay / 2;
                            
                            sprintDailyBurn[lineName][dayIndex] += workerDayHours;
                        });
                    });
                });

                this.sprintDailyBurn = sprintDailyBurn;
            },
            enumerable : false
        },
        parteUserStoriesToUSClosureDates: {
            value: function(userStories)
            {
                self.sprintDailyBurn.usClosureEstimate = userStories;
            },
            enumerable: false
        }
    });
    models.BurndownModel = BurndownModel;
})(viewer.models);