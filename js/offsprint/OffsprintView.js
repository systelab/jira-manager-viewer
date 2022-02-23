(function(views)
{
    var self;

    function OffsprintView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(OffsprintView.prototype,
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
				
				$(document).on("sprint", function (evt, data)
                {             
                    self.sprint = data;
                });
                
                $(document).on("login", function ()
                {             
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Offsprint"});
                    menu.appendTo($(".left-panel-inner .content .main-menu"));
                    menu.click(function()
                    {
                        $.xhrPool.abortAll();
                        
                        $(".menu-item").removeClass("active");
                        $(this).addClass("active");
				
						$(".main-view").load("js/offsprint/template.html", function()
						{
							self.initChart();
							
							$.each(self.issues, function()
							{
								if(this.fields.issuetype.name == "Off-Sprint story")
								{
									$.each(this.fields.subtasks, function()
									{
										self.presenter.getIssue(this.key);
									});
								}
							});
						});
                    });
                });
            },
            enumerable: false
        },
        onSubtask : {
            value: function(data)
            {
                var self = this;
                
                if(data.fields.timetracking.originalEstimateSeconds > 0)
                {
                    var table = $("table.offsprint");
                    
                    var tbody = table.find("#" + data.fields.parent.key);
                    
                    if(tbody.length == 0)
                    {
                        tbody = $("<tbody/>", {id: data.fields.parent.key});
                        tbody.appendTo(table);
                    }
                
                    var row = $("<tr/>");
                    
                    $("<td/>", {html: data.fields.parent.key}).appendTo(row);
                    $("<td/>", {html: data.fields.issuetype.name[0]}).appendTo(row);
                    $("<td/>", {html: data.key}).appendTo(row);
                    $("<td/>", {html: data.fields.summary}).appendTo(row);
                    $("<td/>", {html: data.fields.timetracking.originalEstimateSeconds / 3600}).appendTo(row);
                    $("<td/>", {html: ""}).appendTo(row);
                   
                    for(var i = 0; i < self.workingDays.length; ++i)
                    {
                        $("<td/>", {html: ""}).appendTo(row);
                    }
                    
                    row.appendTo(tbody);
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
                
                this.progress.hide();
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
        onSprint: {
            value: function(data)
            {
                
            },
            enumerable: false
        },
        onIssue : {
            value: function(data)
            {
                var id = data.fields.customfield_14370.id;
                var value = data.fields.customfield_14370.value;
                var timespent = data.fields.timespent / 60 / 60;

				{
					const chartdata = this.hoursChart.data;
					
					var labelIndex = -1;
					
					for (let index = 0; index < chartdata.labels.length; ++index)
					{
						if(chartdata.labels[index] == value)
						{
							labelIndex = index;
							break;
						}
					}
					
					if(labelIndex > -1)
					{
						chartdata.datasets[0].data[labelIndex] += timespent;
						
						var tr = $("#hoursResult > tbody > tr:nth-child(" + (labelIndex + 1) + ")");
						
						tr.attr("data-seconds", parseInt(tr.attr("data-seconds")) + data.fields.timespent);
						tr.find("td:nth-child(2)").html(this.formatSeconds(tr.attr("data-seconds")));
					}
					else
					{
						var tr = $("<tr/>");
						$("<td/>", {html: value}).appendTo(tr);
						$("<td/>", {html: this.formatSeconds(data.fields.timespent)}).appendTo(tr);
						
						tr.attr("data-seconds", data.fields.timespent);
						
						tr.appendTo($("#hoursResult > tbody"));
						
						chartdata.labels.push(value);
						chartdata.datasets[0].data.push(timespent);
					}

					this.hoursChart.update();
					
					var total = $("#hoursResult > tfoot").find("th:nth-child(2)");
					
					total.attr("data-seconds", parseInt(total.attr("data-seconds")) + data.fields.timespent);
					
					total.html(this.formatSeconds(total.attr("data-seconds")));
				}
				
				{
					const chartdata = this.peopleChart.data;
					
					var self = this;
					
					$.each(data.fields.worklog.worklogs, function()
					{
						var id = this.author.accountId;
						var author = this.author.displayName;
						var timespent = this.timeSpentSeconds / 60 / 60;
						
						var element = $("#hoursPeople > tbody").find("tr#" + id);
						
						var labelIndex = -1;
					
						for (let index = 0; index < chartdata.labels.length; ++index)
						{
							if(chartdata.labels[index] == author)
							{
								labelIndex = index;
								break;
							}
						}
						
						if(labelIndex > -1)
						{
							chartdata.datasets[0].data[labelIndex] += timespent;
						}
						else
						{
							chartdata.labels.push(author);
							chartdata.datasets[0].data.push(timespent);
						}

						self.peopleChart.update();
						
						if(element.length)
						{
							element.attr("data-seconds", parseInt(element.attr("data-seconds")) + this.timeSpentSeconds);
							element.find("td:nth-child(2)").html(self.formatSeconds(element.attr("data-seconds")));
						}
						else
						{
							var tr = $("<tr/>", {id: id});
							$("<td/>", {html: author}).appendTo(tr);
							$("<td/>", {html: self.formatSeconds(this.timeSpentSeconds)}).appendTo(tr);
							
							tr.attr("data-seconds", this.timeSpentSeconds);
							
							tr.appendTo($("#hoursPeople > tbody"));
						}
						
						var total = $("#hoursPeople > tfoot").find("th:nth-child(2)");
					
						total.attr("data-seconds", parseInt(total.attr("data-seconds")) + this.timeSpentSeconds);
						
						total.html(self.formatSeconds(total.attr("data-seconds")));
					});
				}
            },
            enumerable: false
        },
        initChart : {
            value: function()
            {
                const ctx = document.getElementById('hoursChart').getContext('2d');
				this.hoursChart = new Chart(ctx, {
					type: 'pie',
					data: {
						labels: [],
						datasets: [{
							data: [],
							label: 'type of offsprint',
							borderWidth: 1,
							backgroundColor: [
								'rgba(255, 99, 132, 0.2)',
								'rgba(54, 162, 235, 0.2)',
								'rgba(255, 206, 86, 0.2)',
								'rgba(75, 192, 192, 0.2)',
								'rgba(153, 102, 255, 0.2)',
								'rgba(255, 159, 64, 0.2)'
							],
							borderColor: [
								'rgba(255, 99, 132, 1)',
								'rgba(54, 162, 235, 1)',
								'rgba(255, 206, 86, 1)',
								'rgba(75, 192, 192, 1)',
								'rgba(153, 102, 255, 1)',
								'rgba(255, 159, 64, 1)'
							]
						}]
					},
					options: {
						responsive: false,
						plugins: {
						  title: {
							display: true,
							text: 'Hours in Offsprints'
						  }
						}
					}
				});
				
				this.peopleChart = new Chart(document.getElementById('peopleChart').getContext('2d'), {
					type: 'pie',
					data: {
						labels: [],
						datasets: [{
							data: [],
							label: 'committers of offsprint',
							borderWidth: 1,
							backgroundColor: [
								'rgba(255, 99, 132, 0.2)',
								'rgba(54, 162, 235, 0.2)',
								'rgba(255, 206, 86, 0.2)',
								'rgba(75, 192, 192, 0.2)',
								'rgba(153, 102, 255, 0.2)',
								'rgba(255, 159, 64, 0.2)'
							],
							borderColor: [
								'rgba(255, 99, 132, 1)',
								'rgba(54, 162, 235, 1)',
								'rgba(255, 206, 86, 1)',
								'rgba(75, 192, 192, 1)',
								'rgba(153, 102, 255, 1)',
								'rgba(255, 159, 64, 1)'
							]
						}]
					},
					options: {
						responsive: false,
						plugins: {
						  title: {
							display: true,
							text: 'Committers in Offsprints'
						  }
						}
					}
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
        formatSeconds : {
            value: function(seconds)
            {
                return (parseInt(seconds) / 60 / 60).toFixed(2);
            },
            enumerable: false
        }
    });

    views.OffsprintView = OffsprintView;
})(viewer.views);