(function(presenters)
{
    function OffsprintPresenter(Context)
    {
        this.interactor = Context.getOffsprintInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
       
        this.view = Context.getOffsprintView(this);
        this.view.init();
    }

    Object.defineProperties(OffsprintPresenter.prototype,
    {
        getSettings : {
            value: function()
            {
                var self = this;
                    
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onLoadSettings(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
		getIssue : {
            value: function(key)
            {
                var self = this;
                    
                this.interactor.getIssue(key, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.getFullWorklog(key, data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getFullWorklog: {
            value: function(key, issue, attempt = 1)
            {
                var self = this;
                var maxAttempts = 3;
                var baseDelayMs = 1000; // 1s

                this.interactor.getFullWorklog(key, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        issue.fields.worklog = data;
                        self.view.onIssue(issue);
                    },
                    function(err)
                    {
                        // Retry on 503 Service Unavailable with exponential backoff
                        var status = (err && err.status) || (err && err.responseJSON && err.responseJSON.status);
                        if (status === 503 && attempt < maxAttempts) {
                            var delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                            console.warn("getFullWorklog 503, retry " + attempt + "/" + maxAttempts + " in " + delay + "ms");
                            setTimeout(function() {
                                self.getFullWorklog(key, issue, attempt + 1);
                            }, delay);
                            return;
                        }
                        // Fall back to error handling
                        self.view.showError(err);
                    }
                ));
            },
            enumerable: false
        },
        getIssues : {
            value: function(issues)
            {
                var self = this;
                    
                this.interactor.getIssues(issues, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSubtasks(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        save : {
            value: function(data)
            {
                var self = this;
                    
                this.interactor.save(data, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSave(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        }
    });

    presenters.OffsprintPresenter = OffsprintPresenter;
})(viewer.presenters);