(function(views)
{
    var self;

    function AnalysisView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(AnalysisView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                this.issues = [];
                
                $(".playlists-list").on("loaded", function (evt, data)
                {             
                    self.issues = data.issues;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Analysis"});
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
        fillDataByEstimateTime: {
            value: function(data) {
                var self = this;

                var table = $(".analysis-table");

                var issuetype = table.find("#issuetype" + data.fields.issuetype.id);
                
                if(issuetype.length == 0)
                {
                    issuetype = $("<div/>", {id: "issuetype" + data.fields.issuetype.id, class: "flex-table-row-item track-name", html: data.fields.issuetype.name});
                    issuetype.appendTo(table.find(".flex-table-header"));
                    
                    $("<div/>", {"data-original-hours": 0, "data-hours": 0, class: "flex-table-row-item track-name"}).appendTo(table.find(".flex-table-body"));
                }
            
                var col = issuetype.index();
                
                var row = table.find("#userstory" + data.fields.parent.key);
                
                if(row.length > 0)
                {
                    var td = row.find("div:nth-child(" + (col + 1) + ")");
                    
                    if(td.length > 0)
                    {
                        var original = this.formatSeconds(data.fields.timetracking.originalEstimateSeconds) + parseInt(td.attr("data-original-hours"));
                        var spent = this.formatSeconds(data.fields.timetracking.timeSpentSeconds) + parseInt(td.attr("data-hours"));
                        
                        var percent = Math.ceil(((spent / original) - 1) * 100);
                        
                        var classPercent = (Math.abs(percent) > 20) ? "red-fg" : "green-fg";
                        
                        td.attr("data-original-hours", original);
                        td.attr("data-hours", spent);
                        td.html("<span class='percent trend " + classPercent + "'>" + percent + "%</span> (" + spent + "h/" + original + "h)");
                        
                        var tdTotal = row.find("div:nth-child(4)");
                        
                        if(tdTotal.length > 0)
                        {
                            var originalTotal = this.formatSeconds(data.fields.timetracking.originalEstimateSeconds) + parseInt(tdTotal.attr("data-original-hours"));
                            var spentTotal = this.formatSeconds(data.fields.timetracking.timeSpentSeconds) + parseInt(tdTotal.attr("data-hours"));
                            var percentTotal = Math.ceil(((spentTotal / originalTotal) - 1) * 100);
                        
                            tdTotal.attr("data-original-hours", originalTotal);
                            tdTotal.attr("data-hours", spentTotal);
                            tdTotal.attr("data-percent", percentTotal);
                            
                            classPercent = (Math.abs(percentTotal) > 20) ? "red-fg" : "green-fg";
                            
                            tdTotal.html("<span class='percent trend " + classPercent + "'>" + percentTotal + "%</span> (" + spentTotal + "h/" + originalTotal + "h)");
                            
                            this.calculateTotal();
                        }
                    }
                }
            },
            enumerable: false
        },
        onSubtask : {
            value: function(data)
            {
                var self = this;
                
                if(data.fields.timetracking.originalEstimateSeconds > 0 && data.fields.timetracking.timeSpentSeconds > 0)
                {
                    this.fillDataByEstimateTime(data);
                }
                else
                {
                    this.fillDataWithoutEstimateTime(data);
                }
            },
            enumerable: false
        },
        fillDataWithoutEstimateTime: {
            value: function(data)
            {
                var self = this;

                // Columns mapping by issuetype.name
                const TYPE_MAP = {
                    "Implementation Task": "DEV",
                    "sub-Tarea Test Auto": "AT",
                    "sub-Tarea QA": "MT"
                };

                const issueTypeName = data.fields.issuetype && data.fields.issuetype.name;
                const typeKey = TYPE_MAP[issueTypeName];
                const parentKey = data.fields.parent && data.fields.parent.key;
                if (!typeKey || !parentKey) return;

                if (!data.fields.timetracking) return;
                const spentSeconds = data.fields.timetracking.timeSpentSeconds || 0;                

                const totalSubtasks = (this.parentTotals && this.parentTotals[parentKey]) || 0;
                if (totalSubtasks === 0) return;

                if (!this.analysisData) this.analysisData = {};

                const entry = this.analysisData[parentKey] || {
                    totalSubtasks,
                    startedAt: null,
                    endedAt: null,
                    closed: false,
                    totalTime: { seconds: 0 },
                    types: {
                        DEV: { seconds: 0 },
                        MT:  { seconds: 0 },
                        AT:  { seconds: 0 }
                    }
                };

                //Is US closed?
                const parentStatus = data.fields.parent && data.fields.parent.fields.status && data.fields.parent.fields.status.name;
                entry.closed = parentStatus === "Closed" || parentStatus === "RESOLVED";

                entry.types[typeKey].seconds += spentSeconds;
                entry.types[typeKey].count += 1;

                entry.totalTime.seconds += spentSeconds;

                // Update the most recent startedAt and endedAt from changelog
                const dates = this.getParentsDateRange(data);
                if (dates) 
                {
                    if (dates.started && (!entry.startedAt || dates.started < entry.startedAt))
                    {
                        entry.startedAt = dates.started;
                    }                    

                    if (entry.closed)
                    {
                        if (dates.closed && (!entry.endedAt || dates.closed > entry.endedAt))
                        {
                            entry.endedAt = dates.closed;
                        }
                    }
                    else
                    {
                        entry.endedAt = new Date(); // still open today
                    }
                }

                this.analysisData[parentKey] = entry;
            },
            enumerable: false
        },
        getParentsDateRange: {
            value: function(data) {
                
                var dates = {};

                const parentKey = data.fields.parent && data.fields.parent.key;
                if (!parentKey) return;

                if (data.changelog && data.changelog.histories && data.changelog.histories.length > 0)
                {
                    // for each history
                    const history = data.changelog.histories;
                    for (let i = 0; i < history.length; i++) {
                        const items = history[i].items;
                        if (items && items.length > 0) {
                            for (let j = 0; j < items.length; j++) {
                                const item = items[j];
                                if (item.field === "status") {
                                    const fromString = item.fromString;
                                    const toString = item.toString;

                                    if (fromString === "CREATED" && toString === "In Progress (migrated)")
                                    {
                                        dates.started = new Date(history[i].created);
                                    }

                                    if (fromString === "In Progress (migrated)" && toString === "RESOLVED")
                                    {
                                        const closedAt = new Date(history[i].created);
                                        if (!dates.closed || closedAt > dates.closed) {
                                            dates.closed = closedAt;
                                        }
                                    }
                                }
                            }
                        }
                    }                
                }

                return dates;
            },
            enumerable: false
        },
        calculateTotal : {
            value: function(data)
            {
				var table = $(".analysis-table");
				var percent = 0;
				var elements = 0;
				
				table.find(".flex-table-body div:nth-child(4)").each(function(idx, element)
                {
                    if(parseInt($(this).attr("data-original-hours")) > 0)
					{
						percent += parseInt($(this).attr("data-percent"));
						++elements;
					}
                });
				
				if(elements > 0)
				{
					var mean = round(Math.abs(percent/elements), 2);
					
					$(".mean-container .mean .hours").html((percent/elements).toFixed(2) + "%");
					
					if(mean > 20)
					{
						$(".mean-container .mean .rates").html("<span class=\"icomoon-trending-down red-fg\"></span><span class=\"trend red-fg\">" + round(mean - 20, 2) + "%</span> above target");
					}
					else
					{
						$(".mean-container .mean .rates").html("<span class=\"icomoon-trending-down green-fg\"></span><span class=\"trend green-fg\">" + round(20 - mean, 2) + "%</span> below target");
					}
				}
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;

                self.analysisData = {}

                self.parentTotals = {};
                $.each(data.issues, function() {
                    var parentKey = this.fields.parent && this.fields.parent.key;
                    if (!parentKey) return;
                    self.parentTotals[parentKey] = (self.parentTotals[parentKey] || 0) + 1;
                });

                $.each(data.issues, function() {
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
                console.log(self.analysisData);
                var table = $(".analysis-table");

                if (!self.analysisData) return;

                // Column indexes
                // [Key(1), Summary(2), USP(3), CLOSED(4), DEV(5), MT(6), AT(7), TOTAL(8), OPENTIME(9)]
                const COL_INDEX = { CLOSED: 4, DEV: 5, MT: 6, AT: 7, TOTAL: 8, OPENTIME: 9 };

                // Clean previous data
                table.find(".flex-table-body").each(function() {
                    $(this).find(`div:nth-child(${COL_INDEX.CLOSED})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.DEV})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.MT})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.AT})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.TOTAL})`).html("");
                    $(this).find(`div:nth-child(${COL_INDEX.OPENTIME})`).html("");
                });

                table.find("#summary-total").remove();

                //Map structure of totals
                const totalsMap = { "DEV": 0, "MT": 0, "AT": 0 };

                let sumTOTAL = 0;

                // Helper to draw the cells like (DEV/MT/AT)
                function renderTypeCell(typeKey, colIndex, entry, row) {
                    const type = entry.types[typeKey] || { seconds: 0 };
                    const hours = self.formatSeconds(type.seconds);
                    totalsMap[typeKey] += hours;
                    const percent = entry.totalTime.seconds > 0 && type.seconds > 0? Math.round((type.seconds / entry.totalTime.seconds) * 100) : 0;

                    const td = row.find(`div:nth-child(${colIndex})`);
                    td.attr("data-hours", hours);
                    td.html(`${hours}h - ${percent}%`);
                }

                // Draw the table from analysisData
                Object.keys(self.analysisData).forEach(function(parentKey) {
                    const entry = self.analysisData[parentKey];
                    const row = table.find("#userstory" + parentKey);
                    if (row.length === 0) return;

                    const totalTime = entry.totalTime.seconds || 0;

                    // Closed
                    const tdClosed = row.find(`div:nth-child(${COL_INDEX.CLOSED})`);
                    tdClosed.html(entry.closed ? "Yes" : "No");

                    renderTypeCell("DEV", COL_INDEX.DEV, entry, row);
                    renderTypeCell("MT",  COL_INDEX.MT, entry, row);
                    renderTypeCell("AT",  COL_INDEX.AT, entry, row);

                    const totalHours = self.formatSeconds(totalTime);
                    const tdTotal = row.find(`div:nth-child(${COL_INDEX.TOTAL})`);
                    tdTotal.attr("data-hours", totalHours);
                    tdTotal.html(`${totalHours}h - 100%`);

                    // Open Time in days
                    const tdOpenTime = row.find(`div:nth-child(${COL_INDEX.OPENTIME})`);
                    if (entry.startedAt && entry.endedAt) {
                        const businessDays = self.getBusinessDays(entry.startedAt, entry.endedAt);
                        tdOpenTime.html(`${businessDays} days`);
                    }

                    sumTOTAL += totalHours;
                });

                // Draw totals row
                const totalRow = $("<div/>", {id: "summary-total", class: "flex-table-row flex-table-body summary-total"});
                $("<div/>", {html: "TOTAL", class: "flex-table-row-item track-name"}).appendTo(totalRow);
                $("<div/>", {html: "", class: "flex-table-row-item artist-name"}).appendTo(totalRow);
                $("<div/>", {html: "", class: "flex-table-row-item track-number"}).appendTo(totalRow);
                $("<div/>", {html: "", class: "flex-table-row-item track-number"}).appendTo(totalRow);
                $("<div/>", {html: `${totalsMap.DEV}h`, class: "flex-table-row-item track-name"}).appendTo(totalRow);
                $("<div/>", {html: `${totalsMap.MT}h`, class: "flex-table-row-item track-name"}).appendTo(totalRow);
                $("<div/>", {html: `${totalsMap.AT}h`, class: "flex-table-row-item track-name"}).appendTo(totalRow);
                $("<div/>", {html: `${sumTOTAL}h`, class: "flex-table-row-item track-name"}).appendTo(totalRow);
                $("<div/>", {html: "", class: "flex-table-row-item track-name"}).appendTo(totalRow);
                totalRow.appendTo(table);
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
        onLoadSettings : {
            value: function(data)
            {
                this.settings = data;
                
                var self = this;
                
                $(".main-view").load("js/analysis/template.html", function()
                {
					var table = $(".analysis-table");
							
					var header = table.find(".flex-table-header");
					
					$("<div/>", {html: "", class: "flex-table-row-item track-name"}).appendTo(header);
					$("<div/>", {html: "User story", class: "flex-table-row-item artist-name"}).appendTo(header);
                    $("<div/>", {html: "USP", class: "flex-table-row-item track-number"}).appendTo(header);
                    $("<div/>", {html: "CLOSED", class: "flex-table-row-item track-number"}).appendTo(header);
                    $("<div/>", {html: "DEV", class: "flex-table-row-item track-name col-sep"}).appendTo(header);
                    $("<div/>", {html: "MT", class: "flex-table-row-item track-name"}).appendTo(header);
                    $("<div/>", {html: "AT", class: "flex-table-row-item track-name"}).appendTo(header);
                    $("<div/>", {html: "TOTAL", class: "flex-table-row-item track-name"}).appendTo(header);
                    $("<div/>", {html: "DAYS OPEN", class: "flex-table-row-item track-name col-sep"}).appendTo(header);
						
					$.each(self.issues, function()
					{
						var row = $("<div/>", {id: "userstory" + this.key, class: "flex-table-row flex-table-body"});
						
						$("<div/>", {html: this.key, class: "flex-table-row-item track-name"}).appendTo(row);
						$("<div/>", {html: this.fields.summary, class: "flex-table-row-item artist-name"}).appendTo(row);
						$("<div/>", {html: this.fields.customfield_10003, class: "flex-table-row-item track-number"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-number"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name col-sep"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name"}).appendTo(row);
                        $("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name col-sep"}).appendTo(row);
						
						row.appendTo(table);
					});
					
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

    views.AnalysisView = AnalysisView;
})(viewer.views);