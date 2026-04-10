(function(views)
{
    var self;

    function CSView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(CSView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.startDate = null;
                this.endDate = null;
                this.issues = [];
                this.csData = {};
                
                $(".playlists-list").on("loaded", function (evt, data)
                {             
                    self.issues = data.issues;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Customer Supports"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                
                        self.presenter.getSettings();
                    });
                });
            },
            enumerable: false
        },
        onSubtask : {
            value: function(issue)
            {
                var self = this;
                
                // Calculate days
                var resolutionTime = self.getBusinessDays(issue.toDoDate, issue.resolvedDate || new Date());
                
                if (issue.toOnHoldDate)
                {
                    var fromOnHoldDate = issue.fromOnHoldDate || new Date();
                    var timeOnHold = self.getBusinessDays(issue.toOnHoldDate, fromOnHoldDate);
                    resolutionTime -= timeOnHold;
                }
                
                var startTime = self.getBusinessDays(issue.toDoDate, issue.inProgressDate || new Date());
                var authorName = issue.fields.assignee ? issue.fields.assignee.displayName : "Unassigned";

                this.csData[issue.key] = {
                    summary: issue.fields.summary,
                    status: issue.fields.status.name,
                    author: authorName,
                    resolutionTime: resolutionTime,
                    startTime: startTime
                };
            },
            enumerable: false
        },
        filterBySprintDays : {
            value: function(issues)
            {
                var self = this;

                $.each(issues, function(index, issue) {
                    if (!issue.changelog || !issue.changelog.histories || issue.changelog.histories.length === 0)
                        return false;

                    var histories = issue.changelog.histories;
                    for (var i = 0; i < histories.length; i++)
                    {
                        var history = histories[i];
                        if (history.items && history.items.length > 0)
                        {
                            for (var j = 0; j < history.items.length; j++)
                            {
                                var item = history.items[j];
                                if (item.field === "status")
                                {
                                    if (item.toString === "RESOLVED")
                                    {
                                        issue.resolvedDate = new Date(history.created);
                                    }
                                    else if (item.toString === "To Do")
                                    {
                                        issue.toDoDate = new Date(history.created);
                                    }
                                    else if (item.toString === "In Progress (migrated)")
                                    {
                                        issue.inProgressDate = new Date(history.created);
                                    }
                                    else if (item.toString === "On Hold")
                                    {
                                        issue.toOnHoldDate = new Date(history.created);
                                    }
                                    else if (item.fromString === "On Hold")
                                    {
                                        issue.fromOnHoldDate = new Date(history.created);
                                    }
                                }
                            }
                        }
                    }
                });

                var filtered = issues.filter(function(issue)
                {
                    return (issue.resolvedDate && issue.resolvedDate >= self.startDate) ||
                           (issue.toDoDate && issue.toDoDate >= self.startDate) ||
                           (issue.inProgressDate && issue.inProgressDate >= self.startDate);
                });

                return filtered;
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;

                self.issues = self.filterBySprintDays(data.issues);

                if (!self.issues || self.issues.length === 0)
                    return;

                $.each(self.issues, function() {
                    self.onSubtask(this);
                });

                this.drawTable();
            },
            enumerable: false
        },
        drawTable : {
            value: function()
            {
                var self = this;                
                console.log(self.csData);
                var table = $(".cs-table");

                if (!self.csData) return;

                // Column indexes
                // [Key(1), Summary(2), Status(3), Author(4), ResolutionTime(5), StartTime(6)]
                const COL_INDEX = { KEY: 1, SUMMARY: 2, STATUS: 3, AUTHOR: 4, RESOLUTIONTIME: 5, STARTTIME: 6 };

                // Clean previous data
                table.find(".flex-table-body").each(function() {
                    $(this).find(`div:nth-child(${COL_INDEX.KEY})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.SUMMARY})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.STATUS})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.AUTHOR})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.RESOLUTIONTIME})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.STARTTIME})`).html("");
                });

                // Draw the table from csData
                Object.keys(self.csData).forEach(function(key) {

                    var row = $("<div/>", {id: "userstory" + key, class: "flex-table-row flex-table-body"}).appendTo(table);

                    $("<div/>", {html: key, class: "flex-table-row-item key"}).appendTo(row);
                    $("<div/>", {html: self.csData[key].summary, class: "flex-table-row-item summary"}).appendTo(row);
                    $("<div/>", {html: self.csData[key].status, class: "flex-table-row-item status"}).appendTo(row);
                    $("<div/>", {html: self.csData[key].author, class: "flex-table-row-item author"}).appendTo(row);
                    $("<div/>", {html: self.csData[key].resolutionTime ? `${self.csData[key].resolutionTime} days` : "", class: "flex-table-row-item open-days"}).appendTo(row);
                    $("<div/>", {html: self.csData[key].startTime ? `${self.csData[key].startTime} days` : "", class: "flex-table-row-item open-days"}).appendTo(row);
                });
            },
            enumerable: false
        },
        getIssues : {
            value: function()
            {
                var self = this;
                
                var issues = [];
                $.each(self.issues, function()
                {
                    issues.push(this.key);
                });
                
                self.presenter.getIssues(issues);
            },
            enumerable: false
        },
        onSprint: {
            value: function(data)
            {
                var self = this;

                if (data.values[0].createdDate && data.values[0].endDate)
                {
                    this.startDate = new Date(data.values[0].createdDate);
                    this.endDate = new Date(data.values[0].endDate);

                    self.prepareTable();
                }
                else
                {
                    this.showError("Sprint data does not have start/end dates.");
                }
            },
            enumerable: false
        },
        prepareTable : {
            value: function()
            {                
                var self = this;

                $(".main-view").load("js/customer_supports/template.html", function()
                {
					var table = $(".cs-table");

					var header = table.find(".flex-table-header");
					
					$("<div/>", {html: "", class: "flex-table-row-item key"}).appendTo(header);
					$("<div/>", {html: "CUSTOMER SUPPORT", class: "flex-table-row-item summary"}).appendTo(header);
                    $("<div/>", {html: "STATUS", class: "flex-table-row-item status"}).appendTo(header);
                    $("<div/>", {html: "AUTHOR", class: "flex-table-row-item author"}).appendTo(header);
                    $("<div/>", {html: "RESOLUTION TIME", class: "flex-table-row-item open-days"}).appendTo(header);
                    $("<div/>", {html: "START TIME", class: "flex-table-row-item open-days"}).appendTo(header);
					
                    self.getIssues();
                });
            },
            enumerable: false
        },
        formatSeconds : {
            value: function(seconds)
            {
                return Math.ceil(parseInt(seconds) / 60 / 60);
            },
            enumerable: false
        },
        showError : {
            value: function(data)
            {
                showError(data);
            },
            enumerable: false
        },
        getBusinessDays: {
            value: function(startDate, endDate) {
                if (!startDate || !endDate) return 0;
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const end   = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                let days = 0;
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const wd = d.getDay(); // 0=Sunday, 6=Saturday
                    if (wd !== 0 && wd !== 6) days++;
                }
                return days;
            },
            enumerable: false
        },
    });

    views.CSView = CSView;
})(viewer.views);