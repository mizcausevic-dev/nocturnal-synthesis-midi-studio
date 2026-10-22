import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { beats, noteName, overlapsOf } from '@/lib/music'
import type { ParsedMidi, Pattern } from '@/lib/types'

export function NotesDialog({ pattern, midi }: { pattern: Pattern; midi?: ParsedMidi }) {
  const notes = midi?.notes ?? []
  const ovs = overlapsOf(notes)
  const overlapInto = new Map(ovs.map((o) => [o.to, o.ticks]))
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1" disabled={!midi}>
          <FileSpreadsheet className="size-4" /> Show notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {pattern.id} {pattern.name}: every note in the file
          </DialogTitle>
          <DialogDescription>
            Read from {pattern.filename} in this browser. Ticks at {midi?.ppq ?? 480} PPQ; beats are quarter notes counted from 0;
            MIDI 60 = C4. Bar numbers start at 1.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Bar</TableHead>
                <TableHead className="text-right">Start tick</TableHead>
                <TableHead className="text-right">Ticks</TableHead>
                <TableHead className="text-right">Beat</TableHead>
                <TableHead className="text-right">Vel</TableHead>
                <TableHead>Chord</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {notes.map((n, i) => {
                const bar = Math.floor(n.ticks / ((midi?.ppq ?? 480) * 4))
                const outside = pattern.outOfScalePitchClasses.includes(n.midi % 12)
                const chordTone = pattern.chordTones[bar]?.includes(n.midi % 12)
                return (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <span className={outside ? 'text-destructive' : ''}>{noteName(n.midi)}</span>
                      <span className="ml-1.5 text-muted-foreground">{n.midi}</span>
                      {overlapInto.has(i) && <span className="ml-1.5 text-brand-b">legato {overlapInto.get(i)}t</span>}
                    </TableCell>
                    <TableCell>{bar + 1}</TableCell>
                    <TableCell className="text-right">{n.ticks}</TableCell>
                    <TableCell className="text-right">{n.durationTicks}</TableCell>
                    <TableCell className="text-right">{beats(n.ticks, midi?.ppq)}</TableCell>
                    <TableCell className="text-right">{n.velocity}</TableCell>
                    <TableCell>
                      {pattern.chords[bar]}
                      <span className={chordTone ? 'ml-1.5 text-success' : 'ml-1.5 text-muted-foreground'}>{chordTone ? 'chord tone' : 'non-chord tone'}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
