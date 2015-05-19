/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for the site's content settings
     */
    function Content(){}
    util.inherits(Content, pb.BaseController);

    //statics
    var SUB_NAV_KEY = 'content_settings';

    Content.prototype.init = function (props, cb) {
        var self = this;

        pb.BaseController.prototype.init.call(self, props, function() {
            self.pathSiteUid = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUid, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.pathSitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUid);
                    var siteService = new pb.SiteService();
                    siteService.getSiteNameByUid(self.pathSiteUid, function (siteName) {
                        self.siteName = siteName;
                        cb();
                    });
                }
            });
        });
    };

    Content.prototype.render = function(cb) {
        var self = this;

        var tabs =
        [
            {
                active: 'active',
                href: '#articles',
                icon: 'files-o',
                title: self.ls.get('ARTICLES')
            },
            {
                href: '#timestamp',
                icon: 'clock-o',
                title: self.ls.get('TIMESTAMP')
            },
            {
                href: '#authors',
                icon: 'user',
                title: self.ls.get('AUTHOR')
            },
            {
                href: '#comments',
                icon: 'comment',
                title: self.ls.get('COMMENTS')
            }
        ];

        var contentService = new pb.ContentService(this.pathSiteUid, true);
        var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'content', { pathSiteUid: self.pathSiteUid, pathSitePrefix: self.pathSitePrefix });
        pills = pb.AdminSubnavService.addSiteToPills(pills, this.siteName);

        contentService.getSettings(function(err, contentSettings) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                pills: pills,
                tabs: tabs,
                contentSettings: contentSettings,
                pathSitePrefix: self.pathSitePrefix
            });

            self.setPageName(self.ls.get('CONTENT'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/content', function(err,result) {
                cb({content: result});
            });
        });
    };

    Content.getSubNavItems = function(key, ls, data) {

        var subNavItems = [{
            name: 'configuration',
            title: ls.get('CONTENT'),
            icon: 'chevron-left',
            href: '/admin' + data.pathSitePrefix + '/site_settings'
        }, {
            name: 'email',
            title: ls.get('EMAIL'),
            icon: 'envelope',
            href: '/admin' + data.pathSitePrefix + '/site_settings/email'
        }];

        if (data.pathSiteUid === pb.SiteService.GLOBAL_SITE) {
            subNavItems.push({
                name: 'libraries',
                title: ls.get('LIBRARIES'),
                icon: 'book',
                href: '/admin' + data.pathSitePrefix + '/site_settings/libraries'
            });
        }

        return subNavItems;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Content.getSubNavItems);

    //exports
    return Content;
};
