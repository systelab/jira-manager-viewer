(function(views)
{
    var self;

    function AnomaliesView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(AnomaliesView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;
                
                this.WARN_INPUT_SECONDS = 18000;   // 5 hours
                this.ERROR_INPUT_SECONDS = 36000; // 10 hours

                this.issues = [];
                this.issuesWorklogs = [];
                
                $(".playlists-list").on("loaded", function (evt, data)
                {             
                    self.issues = data.issues;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Input Anomalies"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
                
                        self.prepareTable();
                    });
                });
            },
            enumerable: false
        },
        onSubtask : {
            value: function(issue)
            {
                var self = this;
                
                self.presenter.getFullWorklog(issue);
            },
            enumerable: false
        },
        onWorklog : {
            value: function(issue)
            {
                var self = this;

                // Helper: "YYYY-MM-DDTHH:mm:ss.SSS+ZZZZ" -> "DD-MM-YYYY, HH:mm"
                function formatWorklogDate(isoStr) {
                    if (!isoStr) return "";
                    const d = new Date(isoStr);
                    if (isNaN(d.getTime())) return isoStr;
                    const pad = (n) => (n < 10 ? "0" + n : "" + n);
                    const day = pad(d.getDate());
                    const month = pad(d.getMonth() + 1);
                    const year = d.getFullYear();
                    const hours = pad(d.getHours());
                    const mins = pad(d.getMinutes());
                    return `${day}-${month}-${year}, ${hours}:${mins}`;
                }

                var worklogs = issue.worklog.worklogs;
                $.each(worklogs, function()
                {
                    if (this.timeSpentSeconds >= self.WARN_INPUT_SECONDS)
                    {
                        var anomaly = {};
                        anomaly.issueKey = issue.key;
                        anomaly.issueSummary = issue.fields.summary;
                        anomaly.worklogAuthor = this.author.displayName;
                        anomaly.worklogCreated = formatWorklogDate(this.created);
                        anomaly.worklogInput = this.timeSpent;
                        anomaly.type = (this.timeSpentSeconds >= self.ERROR_INPUT_SECONDS) ? "error" : "warn";
                        self.drawAnomaly(anomaly);
                    }
                });
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;

                if (!data || data.length === 0)
                    return;

                $.each(data.issues, function() {
                    self.onSubtask(this);
                });
            },
            enumerable: false
        },
        drawAnomaly : {
            value: function(anomaly)
            {
                var $tbody = $("#table__body");
                if ($tbody.length === 0) return;

                $tbody.find(".no-data").remove();

                var $tr = $("<tr/>", { class: "table__row" });

                $("<td/>", { class: "table__cell key",     text: anomaly.issueKey }).appendTo($tr);
                $("<td/>", { class: "table__cell summary", text: anomaly.issueSummary }).appendTo($tr);
                $("<td/>", { class: "table__cell date",    text: anomaly.worklogCreated }).appendTo($tr);

                var inputClass = "table__cell input";
                if (anomaly.type === "error") inputClass += " input--error";
                else if (anomaly.type === "warn") inputClass += " input--warn";
                $("<td/>", { class: inputClass, text: anomaly.worklogInput }).appendTo($tr);

                $("<td/>", { class: "table__cell author",  text: anomaly.worklogAuthor }).appendTo($tr);

                $tbody.append($tr);
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
        filterData : {
            value: function()
            {
                var self = this;

                if (!this.issuesWorklogs && this.issuesWorklogs.length === 0) return;

                // Find anomalies
                this.issuesWorklogs = this.issuesWorklogs.filter(function(issue)
                {
                    return (issue.resolvedDate && issue.resolvedDate >= this.startDate) ||
                           (issue.toDoDate && issue.toDoDate >= this.startDate) ||
                           (issue.inProgressDate && issue.inProgressDate >= this.startDate);
                });
                this.drawTable();
            },
            enumerable: false
        },
        prepareTable : {
            value: function()
            {                
                var self = this;

                $(".main-view").load("js/anomalies/template.html", function()
                {
                    var $tbody = $("#table__body");

                    // Clear previous data
                    $tbody.empty();

                    // Default message when no anomalies
                    $("<tr/>", { class: "table__row no-data" })
                      .append($("<td/>", {
                          class: "table__cell",
                          colspan: 5,
                          text: "No anomalies Found"
                      }))
                      .appendTo($tbody);

                    self.getIssues();
                });
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
    });

    views.AnomaliesView = AnomaliesView;
})(viewer.views);