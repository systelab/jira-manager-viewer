(function(views)
{
    var self;

    function PlanningView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(PlanningView.prototype,
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
                    var menu = $("<div/>", {class: "menu-item", href: "", html: "<i class=\"icon icomoon-arrow-down-right\"></i>Planning"});
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
                    var table = $("table.planning");
                    
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
        onLoadSettings : {
            value: function(data)
            {
                this.settings = data;
                
                var self = this;
                
                $(".main-view").load("js/planning/template.html", function()
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
                        
                        var table = $("table.planning");
                        
                        $.each(self.issues, function()
                        {
                            var row = $("<tr/>");
                            $("<td/>", {html: this.key}).appendTo(row);
                            $("<td/>", {html: this.fields.summary}).appendTo(row);
                            $("<td/>", {html: ""}).appendTo(row);
                            $("<td/>", {html: this.fields.customfield_10003}).appendTo(row);
                            row.appendTo(table);
                            console.log(this)
                        });
                        
                        return false;
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
        }
    });

    views.PlanningView = PlanningView;
})(viewer.views);