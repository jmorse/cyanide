#!/usr/bin/env python

import sys
import pygit2
import re
import yaml
from config import get_repo

team_name = sys.argv[1]
repo = get_repo()
regexp = re.compile("refs/heads/{0}/([^/]*)/master".format(team_name))

refs = dict()

for ref in repo.match_reference_glob('refs/heads/{0}/*'.format(team_name)):
    match = regexp.match(ref.name)
    sys.stdout.write("{0}: {1}\n".format(match.group(1), ref.target.hex))
