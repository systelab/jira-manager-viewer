(function(views)
{
    var self;

    function BurndownView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(BurndownView.prototype,
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
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Burndown"});
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
                
                if(data.fields.timetracking.originalEstimateSeconds > 0)
                {
                    var table = $("table.burndown");
                    
                    var tbody = table.find("#" + data.fields.parent.key);
                    
                    if(tbody.length == 0)
                    {
                        tbody = $("<tbody/>", {id: data.fields.parent.key});
                        tbody.appendTo(table);
                        
                        $("<tbody/>", {html: "<tr/>"}).appendTo(table);
                    }
                
                    var row = $("<tr/>");
                    
                    var estimate = data.fields.timetracking.originalEstimateSeconds / 3600;
                    
                    $("<td/>", {html: data.fields.parent.key}).appendTo(row);
                    $("<td/>", {html: data.fields.issuetype.name[0]}).appendTo(row);
                    $("<td/>", {html: data.key}).appendTo(row);
                    $("<td/>", {html: data.fields.summary}).appendTo(row);
                    $("<td/>", {html: estimate}).appendTo(row);
                    $("<td/>", {html: ""}).appendTo(row);
                   
                    var changes = new Array(self.workingDays.length);
                    var backgrounds = new Array(self.workingDays.length);
                    
                    changes.fill(estimate);
                    //backgrounds.fill("#fff");

                    $.each(data.changelog.histories, function(i)
                    {
                        var date = moment(this.created);
                        
                        var index = self.workingDays.findIndex((element) => element == date.format('DD/MM/YYYY'));
                        
                        if(index > -1)
                        {
                            console.log(this.items);
                            
                            $.each(this.items, function(j)
                            {
                                if(this.field == "timeestimate")
                                {
                                    var from = Math.ceil(parseInt(this.from || 0) / 3600);
                                    var to = Math.ceil(parseInt(this.to || 0) / 3600);
                                    
                                    changes.fill(to, index);
                                }
                                else if(this.field == "status" && this.to == 10028)
                                {
                                    backgrounds[index] = "#0f0";
                                }
                            });
                        }
                    });
                    
                    var index = self.workingDays.findIndex((element) => element == moment().format('DD/MM/YYYY'));
                    
                    if(index > -1)
                    {
                        changes.fill("", index + 1);
                        //backgrounds.fill("", index + 1);
                    }
                    
                    $.each(self.workingDays, function(i)
                    {
                        var value = changes[i];
                        var background = backgrounds[i];
                        
                        $("<td/>", {html: value, style: "background-color: " + background }).appendTo(row);
                    });
                    
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
        onLoadSettings : {
            value: function(data)
            {
                this.settings = data;
                
                var self = this;
                
                $(".main-view").load("js/burndown/template.html", function()
                {
                    self.presenter.getSprint(data.board.id);
                });
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
                var self = this;
                
                $.each(data.values, function()
                {
                    if(this.state == "active")
                    {
                        self.sprint = this;
                        
                        self.workingDays = self.calcBusinessDays(this.startDate, this.endDate);
                        
                        var table = $("table.burndown");
                        
                        var row = $("<tr/>");
                        
                        $("<th/>", {html: "US"}).appendTo(row);
                        $("<th/>", {html: "Type"}).appendTo(row);
                        $("<th/>", {html: "Task"}).appendTo(row);
                        $("<th/>", {html: "Summary"}).appendTo(row);
                        $("<th/>", {html: "Estimated"}).appendTo(row);
                        $("<th/>", {html: ""}).appendTo(row);
                        
                        for(var i = 0; i < self.workingDays.length; ++i)
                        {
                            $("<th/>", {html: self.workingDays[i].substring(0, self.workingDays[i].indexOf("/"))}).appendTo(row);
                        }
                        
                        row.appendTo(table);
                        
                        self.getIssues();
                        
                        //self.presenter.getWorklog(moment(this.startDate).valueOf(), moment(this.endDate).valueOf());
                        
                        return false;
                    }
                });
                
                
            },
            enumerable: false
        },
        onWorklog : {
            value: function(data)
            {
                var self = this;
                
                $.each(data, function( key, value )
                {
                    
                });
                
                //console.log(data);
                
                self.getIssues();
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
        showError : {
            value: function(data)
            {
                showError(data);
            },
            enumerable: false
        }
    });

    views.BurndownView = BurndownView;
})(viewer.views);