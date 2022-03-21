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
                    var table = $("table.analysis");

                    var issuetype = table.find("#issuetype" + data.fields.issuetype.id);
                    
                    if(issuetype.length == 0)
                    {
                        issuetype = $("<td/>", {id: "issuetype" + data.fields.issuetype.id, html: data.fields.issuetype.name});
                        issuetype.appendTo(table.find("thead tr"));
						
						$("<td/>", {"data-original-hours": 0, "data-hours": 0}).appendTo(table.find("tbody tr"));
						$("<td/>").appendTo(table.find("tfoot tr"));
                    }
                
					var col = issuetype.index();
					
					var row = table.find("#userstory" + data.fields.parent.key);
                    
					if(row.length > 0)
					{
						var td = row.find("td:nth-child(" + (col + 1) + ")");
						
						if(td.length > 0)
						{
							var original = this.formatSeconds(data.fields.timetracking.originalEstimateSeconds) + parseInt(td.attr("data-original-hours"));
							var spent = this.formatSeconds(data.fields.timetracking.timeSpentSeconds) + parseInt(td.attr("data-hours"));
							
							var percent = Math.ceil(((spent / original) - 1) * 100);
							
							td.attr("data-original-hours", original);
							td.attr("data-hours", spent);
							td.html(spent + "h/" + original + "h " + percent + "%");
							
							var tdTotal = row.find("td:nth-child(4)");
							
							if(tdTotal.length > 0)
							{
								var originalTotal = this.formatSeconds(data.fields.timetracking.originalEstimateSeconds) + parseInt(tdTotal.attr("data-original-hours"));
								var spentTotal = this.formatSeconds(data.fields.timetracking.timeSpentSeconds) + parseInt(tdTotal.attr("data-hours"));
								var percentTotal = Math.ceil(((spentTotal / originalTotal) - 1) * 100);
							
								tdTotal.attr("data-original-hours", originalTotal);
								tdTotal.attr("data-hours", spentTotal);
								tdTotal.attr("data-percent", percentTotal);
								
								tdTotal.html(spentTotal + "h/" + originalTotal + "h " + percentTotal + "%");
								
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
				var table = $("table.analysis");
				var percent = 0;
				var elements = 0;
				
				table.find("tbody td:nth-child(4)").each(function(idx, element)
                {
                    if(parseInt($(this).attr("data-original-hours")) > 0)
					{
						percent += parseInt($(this).attr("data-percent"));
						++elements;
					}
                });
				
				if(elements > 0)
				{
					table.find("tfoot td:nth-child(4)").html(percent/elements + "%");
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
					var table = $("table.analysis");
							
					$.each(self.issues, function()
					{
						var row = $("<tr/>", {id: "userstory" + this.key});
						$("<td/>", {html: this.key}).appendTo(row);
						$("<td/>", {html: this.fields.summary}).appendTo(row);
						$("<td/>", {html: this.fields.customfield_10003}).appendTo(row);
						$("<td/>", {"data-original-hours": 0, "data-hours": 0, "data-percent": 0}).appendTo(row);
						row.appendTo(table.find("tbody"));
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