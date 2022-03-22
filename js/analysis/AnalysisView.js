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
        onSubtask : {
            value: function(data)
            {
                var self = this;
                
                if(data.fields.timetracking.originalEstimateSeconds > 0 && data.fields.timetracking.timeSpentSeconds > 0)
                {
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
                }
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
					var mean = Math.abs(percent/elements).toFixed(2);
					
					$(".mean-container .mean .hours").html((percent/elements).toFixed(2) + "%");
					
					if(mean > 20)
					{
						$(".mean-container .mean .rates").html("<span class=\"icomoon-trending-down red-fg\"></span><span class=\"trend red-fg\">" + (mean - 20) + "%</span> above target");
					}
					else
					{
						$(".mean-container .mean .rates").html("<span class=\"icomoon-trending-down green-fg\"></span><span class=\"trend green-fg\">" + (20 - mean) + "%</span> below target");
					}
				}
            },
            enumerable: false
        },
        onSubtasks : {
            value: function(data)
            {
                var self = this;
                
                $.each(data.issues, function()
                {
                    self.onSubtask(this);
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
					$("<div/>", {html: "Total", class: "flex-table-row-item track-name"}).appendTo(header);
						
					$.each(self.issues, function()
					{
						var row = $("<div/>", {id: "userstory" + this.key, class: "flex-table-row flex-table-body"});
						
						$("<div/>", {html: this.key, class: "flex-table-row-item track-name"}).appendTo(row);
						$("<div/>", {html: this.fields.summary, class: "flex-table-row-item artist-name"}).appendTo(row);
						$("<div/>", {html: this.fields.customfield_10003, class: "flex-table-row-item track-number"}).appendTo(row);
						$("<div/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0, class: "flex-table-row-item track-name"}).appendTo(row);
						
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
        }
    });

    views.AnalysisView = AnalysisView;
})(viewer.views);