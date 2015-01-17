#!/usr/bin/env python

import sys
import pygit2
import re
import json
from config import get_repo

team_name = sys.argv[1]
repo = get_repo()
regexp = re.compile("refs/heads/{0}/([^/]*)/master".format(team_name))

refs = dict()

for ref in repo.match_reference_glob('refs/heads/{0}/*'.format(team_name)):
    match = regexp.match(ref.name)
    refs[match.group(1)] = ref.target.hex

print json.dumps(refs)
